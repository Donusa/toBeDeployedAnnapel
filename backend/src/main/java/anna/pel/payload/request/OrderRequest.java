package anna.pel.payload.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class OrderRequest {
    @NotNull
    private Long clientId;
    
    @NotNull(message = "Debe especificar un vendedor para el pedido")
    private Long sellerId;
    
    @NotEmpty(message = "Debe incluir al menos un producto en el pedido")
    private List<OrderItemRequest> orderItems;
    
    private LocalDate deliveryDate;
    
    private Boolean delivered = false;
    
    private Boolean paid = false;
    
    @DecimalMin(value = "0.0")
    private Double amountDue = 0.0;
    
    @NotBlank
    private String shippingMethod;
    
    private Long paymentMethodId;
    
    @DecimalMin(value = "0.0")
    private Double shippingCost = 0.0;
    
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private Double customDiscount;

}