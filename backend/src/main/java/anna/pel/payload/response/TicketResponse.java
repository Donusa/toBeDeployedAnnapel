package anna.pel.payload.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketResponse {
    private Long orderId;
    private LocalDate orderDate;
    private ClientResponse client;
    private UserResponse seller;
    private List<ProductTicketResponse> products;
    private Double subtotal;
    private Double shippingCost;
    private Double total;
    private String paymentMethodName;
    private Boolean paid;
    private Double discount;
}