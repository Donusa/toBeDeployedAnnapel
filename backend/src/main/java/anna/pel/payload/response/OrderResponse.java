package anna.pel.payload.response;

import java.time.LocalDate;
import java.util.List;

import anna.pel.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private Long id;
    private ClientResponse client;
    private UserResponse seller;
    private List<OrderItemResponse> orderItems;
    private LocalDate orderDate;
    private LocalDate deliveryDate;
    private Boolean delivered;
    private Boolean paid;
    private Double amountDue;
    private Double total;
    private String shippingMethod;
    private PaymentMethod paymentMethod;
    private Double shippingCost;
    private Double customDiscount;
}