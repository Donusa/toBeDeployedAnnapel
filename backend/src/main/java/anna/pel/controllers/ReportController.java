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
import anna.pel.payload.response.ProductRankingResponse;
import anna.pel.payload.response.MessageResponse;
import java.util.Set;
import java.util.HashSet;
import anna.pel.repository.OrderRepository;
import anna.pel.repository.UserRepository;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/ticket/{orderId}")
    public ResponseEntity<?> generateTicket(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    Double discountToApply = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                            (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);                   
                    
                    Double subtotal = order.getOrderItems().stream()
                            .mapToDouble(OrderItem::getSubtotal)
                            .sum();
                    
                    Double subtotalWithDiscount = subtotal;
                    if (discountToApply > 0) {
                        subtotalWithDiscount = subtotal * (1 - discountToApply / 100.0);
                    }

                    Double total = subtotalWithDiscount + order.getShippingCost();
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

                    String paymentMethodName = order.getPaymentMethod() != null ?
                            order.getPaymentMethod().getName() : "Not specified";
                    UserResponse sellerResponse = new UserResponse(
                            order.getSeller().getId(),
                            order.getSeller().getUsername(),
                            order.getSeller().getEmail(),
                            order.getSeller().getRole().name(),
                            order.getSeller().getCommissionPercentage()
                    );
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

    @GetMapping("/daily-cash-register")
    public ResponseEntity<?> getDailyCashRegister(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Order> dailyOrders = orderRepository.findByOrderDate(date);
        Map<Product, Integer> productQuantityMap = new HashMap<>();
        Map<Product, Double> productAmountMap = new HashMap<>();

        for (Order order : dailyOrders) {
            Double discountToApply = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                    (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);
            
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                productQuantityMap.put(product, productQuantityMap.getOrDefault(product, 0) + item.getQuantity());
                
                Double subtotalWithDiscount = item.getSubtotal();
                if (discountToApply > 0) {
                    subtotalWithDiscount = item.getSubtotal() * (1 - discountToApply / 100.0);
                }
                
                productAmountMap.put(product, productAmountMap.getOrDefault(product, 0.0) + subtotalWithDiscount);
            }
        }

        List<DailyCashRegisterResponse.ProductSoldInfo> productsSold = new ArrayList<>();
        for (Map.Entry<Product, Integer> entry : productQuantityMap.entrySet()) {
            Product product = entry.getKey();
            Integer quantity = entry.getValue();
            Double totalAmount = productAmountMap.get(product);
            ProductResponse productResponse = new ProductResponse(
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
            );

            productsSold.add(new DailyCashRegisterResponse.ProductSoldInfo(
                    productResponse, quantity, totalAmount
            ));
        }

        double cashIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.CASH);
        double cardIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.CARD);
        double transferIncome = calculateIncomeByPaymentMethod(dailyOrders, PaymentMethod.TRANSFER);
        double totalIncome = cashIncome + cardIncome + transferIncome;

        double shippingPayments = dailyOrders.stream()
                .mapToDouble(Order::getShippingCost)
                .sum();

        User adminUser = userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .findFirst()
                .orElse(null);

        double commissionPercentage = adminUser != null ? adminUser.getCommissionPercentage() : 0.0;
        double commissionAmount = totalIncome * (commissionPercentage / 100.0);
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

    private double calculateIncomeByPaymentMethod(List<Order> orders, String paymentMethodName) {
        double total = orders.stream()
                .filter(order -> order.getPaymentMethod() != null && 
                        paymentMethodName.equals(order.getPaymentMethod().getName()))
                .flatMap(order -> order.getOrderItems().stream()
                        .map(item -> {
                            Double discountToApply = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                                    (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);
                            return item.getSubtotal() * (1 - discountToApply / 100.0);
                        }))
                .mapToDouble(Double::doubleValue)
                .sum();
        
        System.out.println("Total calculado para " + paymentMethodName + ": " + total);
        return total;
    }

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
                                Double discountToApply = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                                        (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);
                                
                                Double subtotal = order.getOrderItems().stream()
                                        .mapToDouble(OrderItem::getSubtotal)
                                        .sum();
                                
                                if (discountToApply > 0) {
                                    return subtotal * (1 - discountToApply / 100.0);
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
                                        item.getSubtotal() * (1 - ((order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                                                (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0)) / 100.0)),
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
    
    @GetMapping("/product-ranking")
    public ResponseEntity<?> getProductRanking(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate finalStartDate;
        LocalDate finalEndDate;

        if (startDate != null && endDate != null) {
            finalStartDate = startDate;
            finalEndDate = endDate;
        } else if (period != null && date != null) {
            switch (period.toLowerCase()) {
                case "day":
                    finalStartDate = date;
                    finalEndDate = date;
                    break;
                case "fortnight":
                    finalStartDate = date.minusDays(13);
                    finalEndDate = date;
                    break;
                case "month":
                    finalStartDate = date.withDayOfMonth(1);
                    finalEndDate = date.withDayOfMonth(date.lengthOfMonth());
                    break;
                default:
                    return ResponseEntity.badRequest().body(new MessageResponse("Invalid period. Use 'day', 'fortnight', or 'month'."));
            }
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Either provide 'period' and 'date' or 'startDate' and 'endDate'."));
        }

        List<Order> orders = orderRepository.findByOrderDateBetween(finalStartDate, finalEndDate);
        Map<Product, Integer> productQuantityMap = new HashMap<>();

        Map<Product, Set<Long>> productOrdersMap = new HashMap<>();

        for (Order order : orders) {
             for (OrderItem item : order.getOrderItems()) {
                 Product product = item.getProduct();
                 
                 productQuantityMap.put(product, productQuantityMap.getOrDefault(product, 0) + item.getQuantity());
                 
                 productOrdersMap.computeIfAbsent(product, k -> new HashSet<>()).add(order.getId());
             }
         }

        List<ProductRankingResponse> productRanking = productQuantityMap.entrySet().stream()
                .map(entry -> {
                    Product product = entry.getKey();
                    Integer totalQuantity = entry.getValue();
                    Integer totalOrders = Integer.valueOf(productOrdersMap.get(product).size());

                    ProductResponse productResponse = new ProductResponse(
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
                    );

                    return new ProductRankingResponse(
                            productResponse,
                            totalQuantity, 
                            totalOrders,
                            0
                    );
                })
                .sorted((p1, p2) -> Integer.compare(p2.getTotalQuantitySold(), p1.getTotalQuantitySold()))
                .collect(Collectors.toList());

        for (int i = 0; i < productRanking.size(); i++) {
            productRanking.get(i).setRanking(Integer.valueOf(i + 1));
        }

        return ResponseEntity.ok(productRanking);
    }
    
}