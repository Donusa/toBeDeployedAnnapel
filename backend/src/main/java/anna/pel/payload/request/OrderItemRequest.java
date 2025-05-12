package anna.pel.payload.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderItemRequest {
    @NotNull(message = "El ID del producto es obligatorio")
    private Long productId;
    
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @NotNull(message = "La cantidad es obligatoria")
    private Integer quantity = 1;
}