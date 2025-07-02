package anna.pel.controllers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import anna.pel.model.Order;
import anna.pel.model.OrderItem;
import anna.pel.model.PaymentMethod;
import anna.pel.model.Product;
import anna.pel.model.User;
import anna.pel.payload.response.ClientResponse;
import anna.pel.payload.response.DailyCashRegisterResponse;
import anna.pel.payload.response.OrderResponse;
import anna.pel.payload.response.OrderItemResponse;
import anna.pel.payload.response.ProductResponse;
import anna.pel.payload.response.ProductTicketResponse;
import anna.pel.payload.response.TicketResponse;
import anna.pel.payload.response.UserCommissionResponse;
import anna.pel.payload.response.UserResponse;
import anna.pel.repository.OrderRepository;
import anna.pel.repository.UserRepository;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Generate a ticket for printing based on an order
     */
    @GetMapping("/ticket/{orderId}")
    public ResponseEntity<?> generateTicket(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    // Get client discount percentage
 Double clientDiscount = order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0;                   
                    
                    // Calculate subtotal (sum of all order items subtotals)
                    Double subtotal = order.getOrderItems().stream()
                            .mapToDouble(OrderItem::getSubtotal)
                            .sum();
                    
                    // Apply client discount to subtotal
                    Double subtotalWithDiscount = subtotal;
                    if (clientDiscount > 0) {
                        subtotalWithDiscount = subtotal * (1 - clientDiscount / 100.0);
                    }

                    // Calculate total (subtotal with discount + shipping cost)
                    Double total = subtotalWithDiscount + order.getShippingCost();

                    // Create client response
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

                    // Create product response list from order items
                    List<ProductTicketResponse> productResponses = order.getOrderItems().stream()
                            .map(item -> {
                                Product product = item.getProduct();
                                return new ProductTicketResponse(
                                    product.getId(),
                                    product.getName(),
                                    product.getFormaldehydePercentage(),
                                    item.getPrice(),
                                    product.getCost(),
                                    product.getType(),
                                    product.getCode(),
                                    product.getSize(),
                                    item.getQuantity()
                                );
                            })
                            .collect(Collectors.toList());

                    // Get payment method name
                    String paymentMethodName = order.getPaymentMethod() != null ?
                            order.getPaymentMethod().getName() : "Not specified";

                    // Create seller response
                    UserResponse sellerResponse = new UserResponse(
                            order.getSeller().getId(),
                            order.getSeller().getUsername(),
                            order.getSeller().getEmail(),
                            order.getSeller().getRole().name(),
                            order.getSeller().getCommissionPercentage()
                    );
                    
                    // Create and return ticket response
                    TicketResponse ticketResponse = new TicketResponse(
                            order.getId(),
                            order.getOrderDate(),
                            clientResponse,
                            sellerResponse,
                            productResponses,
                            subtotalWithDiscount,
                            order.getShippingCost(),
                            total,
                            paymentMethodName,
                            order.getPaid()
                    );

                    return ResponseEntity.ok(ticketResponse);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Generate daily cash register report for a specific date
     */
    @GetMapping("/daily-cash-register")
    public ResponseEntity<?> getDailyCashRegister(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        // Get all orders for the specified date
        List<Order> dailyOrders = orderRepository.findByOrderDate(date);

        
        // Calculate products sold with quantities
        Map<Product, Integer> productQuantityMap = new HashMap<>();
        Map<Product, Double> productAmountMap = new HashMap<>();

        for (Order order : dailyOrders) {
            // Get client discount percentage
            Double clientDiscount = order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0;
            
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                productQuantityMap.put(product, productQuantityMap.getOrDefault(product, 0) + item.getQuantity());
                
                // Apply client discount to subtotal
                Double subtotalWithDiscount = item.getSubtotal();
                if (clientDiscount > 0) {
                    subtotalWithDiscount = item.getSubtotal() * (1 - clientDiscount / 100.0);
                }
                
                productAmountMap.put(product, productAmountMap.getOrDefault(product, 0.0) + subtotalWithDiscount);
            }
        }

        List<DailyCashRegisterResponse.ProductSoldInfo> productsSold = new ArrayList<>();
        for (Map.Entry<Product, Integer> entry : productQuantityMap.entrySet()) {
            Product product = entry.getKey();
            Integer quantity = entry.getValue();
            Double totalAmount = productAmountMap.get(product);

            // Usar el precio actual del producto para el informe, pero el monto total es el calculado de los items
            ProductResponse productResponse = new ProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getFormaldehydePercentage(),
                    product.getPrice(), // Precio actual del producto
                    product.getCost(),
                    product.getType(),
                    product.getCode(),
                    product.getSize(),
                    product.getCurrentStock(),
                    product.getMinimumStock()
            );

            productsSold.add(new DailyCashRegisterResponse.ProductSoldInfo(
                    productResponse, quantity, totalAmount
            ));
        }

        // Calculate income by payment method
        double cashIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.CASH);
        double cardIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.CARD);
        double transferIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.TRANSFER);
        double totalIncome = cashIncome + cardIncome + transferIncome;

        // Calculate shipping payments
        double shippingPayments = dailyOrders.stream()
                .mapToDouble(Order::getShippingCost)
                .sum();

        // Get commission percentage from the first admin user (or use default)
        User adminUser = userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .findFirst()
                .orElse(null);

        double commissionPercentage = adminUser != null ? adminUser.getCommissionPercentage() : 0.0;
        double commissionAmount = totalIncome * (commissionPercentage / 100.0);

        // Create and return daily cash register response
        DailyCashRegisterResponse response = new DailyCashRegisterResponse();
        response.setDate(date);
        response.setProductsSold(productsSold);
        response.setCashIncome(cashIncome);
        response.setCardIncome(cardIncome);
        response.setTransferIncome(transferIncome);
        response.setTotalIncome(totalIncome);
        response.setCommissionPercentage(commissionPercentage);
        response.setCommissionAmount(commissionAmount);
        response.setShippingPayments(shippingPayments);

        return ResponseEntity.ok(response);
    }

  
    
    
    /**
     * Helper method to calculate income by payment method
     */
    private double calculateIncomeByPaymentMethod(List<Order> orders, String paymentMethodName) {
        return orders.stream()
                .filter(order -> order.getPaymentMethod() != null && 
                        paymentMethodName.equals(order.getPaymentMethod().getName()))
                .flatMap(order -> order.getOrderItems().stream())
                .mapToDouble(OrderItem::getSubtotal)
                .sum();
    }

    /**
     * Get sales report by user for a specific date
     */
    @GetMapping("/user-sales")
    public ResponseEntity<?> getUserSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Order> dailyOrders = orderRepository.findByOrderDate(date);

        Map<User, List<Order>> ordersBySeller = dailyOrders.stream()
                .collect(Collectors.groupingBy(Order::getSeller));

        List<UserCommissionResponse> userSalesReports = ordersBySeller.entrySet().stream()
                .map(entry -> {
                    User seller = entry.getKey();
                    List<Order> sellerOrders = entry.getValue();

                    double totalSales = sellerOrders.stream()
                            .mapToDouble(order -> {
                                // Get client discount percentage
                                Double clientDiscount = order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0;
                                
                                // Calculate subtotal
                                Double subtotal = order.getOrderItems().stream()
                                        .mapToDouble(OrderItem::getSubtotal)
                                        .sum();
                                
                                // Apply client discount
                                if (clientDiscount > 0) {
                                    return subtotal * (1 - clientDiscount / 100.0);
                                }
                                return subtotal;
                            })
                            .sum();

                    double commission = totalSales * (seller.getCommissionPercentage() / 100.0);

                    List<OrderResponse> orderResponses = sellerOrders.stream()
                            .map(order -> {
                                OrderResponse response = new OrderResponse();
                                response.setId(order.getId());
                                response.setClient(new ClientResponse(
                                    order.getClient().getId(),
                                    order.getClient().getName(),
                                    order.getClient().getAddress(),
                                    order.getClient().getPhone(),
                                    order.getClient().getDni(),
                                    order.getClient().getEmail(),
                                    order.getClient().getCurrentAccount(),
                                    order.getClient().getDiscount(),
                                    order.getClient().getLocation()
                                ));
                                response.setSeller(new UserResponse(
                                    seller.getId(),
                                    seller.getUsername(),
                                    seller.getEmail(),
                                    seller.getRole().name(),
                                    seller.getCommissionPercentage()
                                ));
                                response.setOrderItems(order.getOrderItems().stream()
                                    .<OrderItemResponse>map(item -> new OrderItemResponse(
                                        item.getId(),
                                        item.getProduct().getId(),
                                        item.getProduct().getName(),
                                        item.getProduct().getCode(),
                                        item.getQuantity(),
                                        item.getPrice(),
                                        // Apply client discount to subtotal
                                        item.getSubtotal() * (1 - (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0) / 100.0),
                                        new ProductResponse(
                                            item.getProduct().getId(),
                                            item.getProduct().getName(),
                                            item.getProduct().getFormaldehydePercentage(),
                                            item.getProduct().getPrice(),
                                            item.getProduct().getCost(),
                                            item.getProduct().getType(),
                                            item.getProduct().getCode(),
                                            item.getProduct().getSize(),
                                            item.getProduct().getCurrentStock(),
                                            item.getProduct().getMinimumStock()
                                        )
                                    ))
                                    .collect(Collectors.toList()));
                                response.setOrderDate(order.getOrderDate());
                                response.setDeliveryDate(order.getDeliveryDate());
                                response.setDelivered(order.getDelivered());
                                response.setPaid(order.getPaid());
                                response.setAmountDue(order.getAmountDue());
                                response.setShippingMethod(order.getShippingMethod());
                                response.setPaymentMethod(order.getPaymentMethod());
                                response.setShippingCost(order.getShippingCost());
                                return response;
                            })
                            .collect(Collectors.toList());

                    return new UserCommissionResponse(
                            new UserResponse(
                                seller.getId(),
                                seller.getUsername(),
                                seller.getEmail(),
                                seller.getRole().name(),
                                seller.getCommissionPercentage()
                            ),
                            orderResponses,
                            totalSales,
                            commission
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(userSalesReports);
    }
    
}