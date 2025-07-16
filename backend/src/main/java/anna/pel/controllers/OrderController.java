package anna.pel.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import anna.pel.model.Client;
import anna.pel.model.Order;
import anna.pel.model.OrderItem;
import anna.pel.model.Product;
import anna.pel.model.User;
import anna.pel.payload.request.OrderItemRequest;
import anna.pel.payload.request.OrderRequest;
import anna.pel.payload.response.ClientResponse;
import anna.pel.payload.response.MessageResponse;
import anna.pel.payload.response.OrderItemResponse;
import anna.pel.payload.response.OrderResponse;
import anna.pel.payload.response.ProductResponse;
import anna.pel.payload.response.UserResponse;
import anna.pel.repository.ClientRepository;
import anna.pel.repository.OrderRepository;
import anna.pel.repository.PaymentMethodRepository;
import anna.pel.repository.ProductRepository;
import anna.pel.repository.UserRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private PaymentMethodRepository paymentMethodRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        List<OrderResponse> orders = orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getOrdersByClient(@PathVariable Long clientId) {
        return clientRepository.findById(clientId)
                .map(client -> {
                    List<OrderResponse> orders = orderRepository.findByClient(client).stream()
                            .map(this::convertToResponse)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(orders);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<?> getOrdersBySeller(@PathVariable Long sellerId) {
        return userRepository.findById(sellerId)
                .map(seller -> {
                    List<OrderResponse> orders = orderRepository.findBySeller(seller).stream()
                            .map(this::convertToResponse)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(orders);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        // Validate client exists
        Client client = clientRepository.findById(orderRequest.getClientId())
                .orElse(null);
        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Client not found!"));
        }
        
        // Validate seller exists
        User seller = userRepository.findById(orderRequest.getSellerId())
                .orElse(null);
        if (seller == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Seller not found!"));
        }

        // Validate products exist and create order items
        Order order = new Order();
        order.setClient(client);
        order.setSeller(seller);
        
        // Asumiendo que OrderRequest ahora tiene una lista de items con producto y cantidad
        if (orderRequest.getOrderItems() != null && !orderRequest.getOrderItems().isEmpty()) {
            for (OrderItemRequest itemRequest : orderRequest.getOrderItems()) {
                Product product = productRepository.findById(itemRequest.getProductId()).orElse(null);
                if (product == null) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Product with ID " + itemRequest.getProductId() + " not found!"));
                }
                
                // Verificar si hay suficiente stock disponible
                if (product.getCurrentStock() < itemRequest.getQuantity()) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Stock insuficiente para el producto " + product.getName() + ". Stock disponible: " + product.getCurrentStock()));
                }
                
                // Reducir el stock del producto
                product.setCurrentStock(product.getCurrentStock() - itemRequest.getQuantity());
                productRepository.save(product);
                
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setProduct(product);
                orderItem.setQuantity(itemRequest.getQuantity());
                orderItem.setPrice(product.getPrice()); // Usar el precio actual del producto
                order.getOrderItems().add(orderItem);
            }
        }
        order.setDeliveryDate(orderRequest.getDeliveryDate());
        order.setDelivered(orderRequest.getDelivered());
        order.setPaid(orderRequest.getPaid());
        
        // Si el pedido se marca como pagado, establecer la deuda en 0
        if (orderRequest.getPaid() != null && orderRequest.getPaid()) {
            order.setAmountDue(0.0);
        } else {
            order.setAmountDue(orderRequest.getAmountDue());
        }
        order.setShippingMethod(orderRequest.getShippingMethod());
        order.setShippingCost(orderRequest.getShippingCost());
        
        // Set payment method if provided
        if (orderRequest.getPaymentMethodId() != null) {
            paymentMethodRepository.findById(orderRequest.getPaymentMethodId())
                    .ifPresent(order::setPaymentMethod);
        }

        Order savedOrder = orderRepository.save(order);
        
        // Actualizar la deuda del cliente (currentAccount) si la orden tiene deuda pendiente
        // Usar el amountDue del pedido guardado (que ya es 0 si está pagado)
        if (savedOrder.getAmountDue() != null && savedOrder.getAmountDue() > 0) {
            // Inicializar currentAccount si es null
            if (client.getCurrentAccount() == null) {
                client.setCurrentAccount(0.0);
            }
            // Sumar la deuda de la orden a la cuenta corriente del cliente
            client.setCurrentAccount(client.getCurrentAccount() + savedOrder.getAmountDue());
            clientRepository.save(client);
        }
        
        return ResponseEntity.ok(convertToResponse(savedOrder));
    }
    

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @Valid @RequestBody OrderRequest orderRequest) {
        return orderRepository.findById(id)
                .map(order -> {
                    // Validate client exists
                    Client client = clientRepository.findById(orderRequest.getClientId())
                            .orElse(null);
                    if (client == null) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Client not found!"));
                    }
                    
                    // Validate seller exists
                    User seller = userRepository.findById(orderRequest.getSellerId())
                            .orElse(null);
                    if (seller == null) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Seller not found!"));
                    }

                    // Guardar la deuda anterior y el estado de pago anterior para calcular la diferencia después
                    Double previousAmountDue = order.getAmountDue();
                    Boolean previousPaidStatus = order.getPaid();
                    
                    // Update client and seller
                    order.setClient(client);
                    order.setSeller(seller);
                    
                    // Restaurar el stock de los productos en la orden actual antes de actualizarla
                    for (OrderItem existingItem : order.getOrderItems()) {
                        Product existingProduct = existingItem.getProduct();
                        existingProduct.setCurrentStock(existingProduct.getCurrentStock() + existingItem.getQuantity());
                        productRepository.save(existingProduct);
                    }
                    
                    // Clear existing order items and add new ones
                    order.getOrderItems().clear();
                    
                    // Add new order items
                    if (orderRequest.getOrderItems() != null && !orderRequest.getOrderItems().isEmpty()) {
                        for (OrderItemRequest itemRequest : orderRequest.getOrderItems()) {
                            Product product = productRepository.findById(itemRequest.getProductId()).orElse(null);
                            if (product == null) {
                                return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Product with ID " + itemRequest.getProductId() + " not found!"));
                            }
                            
                            // Verificar si hay suficiente stock disponible
                            if (product.getCurrentStock() < itemRequest.getQuantity()) {
                                return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Stock insuficiente para el producto " + product.getName() + ". Stock disponible: " + product.getCurrentStock()));
                            }
                            
                            // Reducir el stock del producto
                            product.setCurrentStock(product.getCurrentStock() - itemRequest.getQuantity());
                            productRepository.save(product);
                            
                            OrderItem orderItem = new OrderItem();
                            orderItem.setOrder(order);
                            orderItem.setProduct(product);
                            orderItem.setQuantity(itemRequest.getQuantity());
                            orderItem.setPrice(product.getPrice()); // Usar el precio actual del producto
                            order.getOrderItems().add(orderItem);
                        }
                    }
                    order.setDeliveryDate(orderRequest.getDeliveryDate());
                    order.setDelivered(orderRequest.getDelivered());
                    order.setPaid(orderRequest.getPaid());
                    
                    // Si el pedido se marca como pagado, establecer la deuda en 0
                    if (orderRequest.getPaid() != null && orderRequest.getPaid()) {
                        order.setAmountDue(0.0);
                    } else {
                        order.setAmountDue(orderRequest.getAmountDue());
                    }
                    order.setShippingMethod(orderRequest.getShippingMethod());
                    order.setShippingCost(orderRequest.getShippingCost());
                    
                    // Set payment method if provided
                    if (orderRequest.getPaymentMethodId() != null) {
                        paymentMethodRepository.findById(orderRequest.getPaymentMethodId())
                                .ifPresent(order::setPaymentMethod);
                    }

                    Order updatedOrder = orderRepository.save(order);
                    
                    // Actualizar la deuda del cliente (currentAccount) basado en la diferencia entre la deuda anterior y la nueva
                    if (previousAmountDue != null || updatedOrder.getAmountDue() != null) {
                        // Inicializar valores nulos
                        if (previousAmountDue == null) previousAmountDue = 0.0;
                        Double newAmountDue = updatedOrder.getAmountDue() != null ? updatedOrder.getAmountDue() : 0.0;
                        
                        // Si el pedido anterior estaba marcado como pagado, la deuda anterior efectiva era 0
                        Double effectivePreviousAmountDue = (previousPaidStatus != null && previousPaidStatus) ? 0.0 : previousAmountDue;
                        
                        // La nueva deuda efectiva es directamente el amountDue del pedido actualizado (ya es 0 si está pagado)
                        Double effectiveNewAmountDue = newAmountDue;
                        
                        // Inicializar currentAccount si es null
                        if (client.getCurrentAccount() == null) {
                            client.setCurrentAccount(0.0);
                        }
                        
                        // Calcular la diferencia usando las deudas efectivas y actualizar la cuenta del cliente
                        Double difference = effectiveNewAmountDue - effectivePreviousAmountDue;
                        client.setCurrentAccount(client.getCurrentAccount() + difference);
                        clientRepository.save(client);
                    }
                    
                    return ResponseEntity.ok(convertToResponse(updatedOrder));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(order -> {
                    // Restaurar el stock de los productos antes de eliminar la orden
                    for (OrderItem item : order.getOrderItems()) {
                        Product product = item.getProduct();
                        product.setCurrentStock(product.getCurrentStock() + item.getQuantity());
                        productRepository.save(product);
                    }
                    
                    // Actualizar la deuda del cliente (currentAccount) si la orden tenía deuda pendiente
                    // Solo restar deuda si el pedido NO estaba marcado como pagado
                    Client client = order.getClient();
                    if (order.getAmountDue() != null && order.getAmountDue() > 0 && client != null &&
                        (order.getPaid() == null || !order.getPaid())) {
                        // Inicializar currentAccount si es null
                        if (client.getCurrentAccount() == null) {
                            client.setCurrentAccount(0.0);
                        }
                        // Restar la deuda de la orden a la cuenta corriente del cliente
                        client.setCurrentAccount(client.getCurrentAccount() - order.getAmountDue());
                        clientRepository.save(client);
                    }
                    
                    orderRepository.delete(order);
                    return ResponseEntity.ok(new MessageResponse("Order deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private OrderResponse convertToResponse(Order order) {
        // Convert client to ClientResponse
        ClientResponse clientResponse = new ClientResponse(
                order.getClient().getId(),
                order.getClient().getName(),
                order.getClient().getAddress(),
                order.getClient().getPhone(),
                order.getClient().getDni(),
                order.getClient().getEmail(),
                order.getClient().getCurrentAccount(),
                order.getClient().getDiscount(),
                order.getClient().getLocation()
        );
        
        // Convert seller to UserResponse
        UserResponse sellerResponse = new UserResponse(
                order.getSeller().getId(),
                order.getSeller().getUsername(),
                order.getSeller().getEmail(),
                order.getSeller().getRole().toString(),
                order.getSeller().getCommissionPercentage()
        );

        // Get client discount percentage
        Double clientDiscount = order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0;

        // Convert order items to OrderItemResponse list
        List<OrderItemResponse> orderItemResponses = order.getOrderItems().stream()
                .map(item -> {
                    Product product = item.getProduct();
                    // Calculate subtotal with client discount applied
                    Double subtotalWithDiscount = item.getSubtotal();
                    if (clientDiscount > 0) {
                        subtotalWithDiscount = item.getSubtotal() * (1 - clientDiscount / 100.0);
                    }
                    return new OrderItemResponse(
                            item.getId(),
                            product.getId(),
                            product.getName(),
                            product.getCode(),
                            item.getQuantity(),
                            item.getPrice(),
                            subtotalWithDiscount,
                            new ProductResponse(
                                product.getId(),
                                product.getName(),
                                product.getFormaldehydePercentage(),
                                product.getPrice(),
                                product.getCost(),
                                product.getType(),
                                product.getCode(),
                                product.getSize(),
                                product.getCurrentStock(),
                                product.getMinimumStock()
                            )
                    );
                })
                .collect(Collectors.toList());

        // Calculate subtotal (sum of all order items subtotals with discount already applied)
        Double subtotalWithDiscount = orderItemResponses.stream()
                .mapToDouble(OrderItemResponse::getSubtotal)
                .sum();

        // Calculate total (subtotal with discount + shipping cost)
        Double total = subtotalWithDiscount + order.getShippingCost();

        return new OrderResponse(
                order.getId(),
                clientResponse,
                sellerResponse,
                orderItemResponses,
                order.getOrderDate(),
                order.getDeliveryDate(),
                order.getDelivered(),
                order.getPaid(),
                order.getAmountDue(), // Use the actual debt amount for this specific order
                total, // Use the calculated total with discount
                order.getShippingMethod(),
                order.getPaymentMethod(),
                order.getShippingCost()
        );
    }
}