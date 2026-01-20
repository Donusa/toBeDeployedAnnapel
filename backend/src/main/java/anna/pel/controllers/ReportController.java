package anna.pel.controllers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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
import anna.pel.payload.response.MessageResponse;
import anna.pel.payload.response.OrderItemResponse;
import anna.pel.payload.response.OrderResponse;
import anna.pel.payload.response.ProductRankingResponse;
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
                            order.getPaid(),
                            order.getCustomDiscount() 
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

        double commissionAmount = dailyOrders.stream()
                .mapToDouble(order -> {
                    Double discountToApply = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                            (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);
                    
                    Double orderTotal = order.getOrderItems().stream()
                            .mapToDouble(item -> {
                                Double subtotalWithDiscount = item.getSubtotal();
                                if (discountToApply > 0) {
                                    subtotalWithDiscount = item.getSubtotal() * (1 - discountToApply / 100.0);
                                }
                                return subtotalWithDiscount;
                            })
                            .sum();
                    
                    return orderTotal * (order.getSeller().getCommissionPercentage() / 100.0);
                })
                .sum();
        
        DailyCashRegisterResponse response = new DailyCashRegisterResponse();
        response.setDate(date);
        response.setProductsSold(productsSold);
        response.setCashIncome(cashIncome);
        response.setCardIncome(cardIncome);
        response.setTransferIncome(transferIncome);
        response.setTotalIncome(totalIncome);
        // We can set commissionPercentage to 0 or average, or remove it, but for now let's leave it as 0 or ignore it since it varies per user.
        response.setCommissionPercentage(0.0); 
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate finalStartDate;
        LocalDate finalEndDate;

        if (startDate != null && endDate != null) {
            finalStartDate = startDate;
            finalEndDate = endDate;
        } else if (date != null) {
            finalStartDate = date;
            finalEndDate = date;
        } else {
            finalStartDate = LocalDate.now().minusMonths(1);
            finalEndDate = LocalDate.now();
        }

        System.out.println("Fetching user sales from " + finalStartDate + " to " + finalEndDate);

        List<Order> dailyOrders = orderRepository.findByOrderDateBetween(finalStartDate, finalEndDate);
        System.out.println("Found " + dailyOrders.size() + " orders in range.");

        Map<User, Map<LocalDate, List<Order>>> ordersBySellerAndDate = dailyOrders.stream()
                .collect(Collectors.groupingBy(Order::getSeller,
                        Collectors.groupingBy(Order::getOrderDate)));
        
        System.out.println("Grouped by " + ordersBySellerAndDate.size() + " sellers.");

        List<UserCommissionResponse> userSalesReports = new ArrayList<>();

        ordersBySellerAndDate.forEach((seller, dateMap) -> {
            dateMap.forEach((orderDate, sellerOrders) -> {
                
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
                            
                            // Calculate total
                            Double discountToApplyOrder = order.getCustomDiscount() != null ? order.getCustomDiscount() : 
                                    (order.getClient().getDiscount() != null ? order.getClient().getDiscount() : 0.0);
                            
                            Double subtotalOrder = order.getOrderItems().stream()
                                    .mapToDouble(OrderItem::getSubtotal)
                                    .sum();
                            
                            Double totalWithDiscountOrder = subtotalOrder;
                            if (discountToApplyOrder > 0) {
                                totalWithDiscountOrder = subtotalOrder * (1 - discountToApplyOrder / 100.0);
                            }
                            
                            response.setTotal(totalWithDiscountOrder + order.getShippingCost());
                            
                            return response;
                        })
                        .collect(Collectors.toList());

                userSalesReports.add(new UserCommissionResponse(
                        new UserResponse(
                            seller.getId(),
                            seller.getUsername(),
                            seller.getEmail(),
                            seller.getRole().name(),
                            seller.getCommissionPercentage()
                        ),
                        orderResponses,
                        totalSales,
                        commission,
                        orderDate
                ));
            });
        });
        
        // Sort by date descending
        userSalesReports.sort((r1, r2) -> r2.getDate().compareTo(r1.getDate()));

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