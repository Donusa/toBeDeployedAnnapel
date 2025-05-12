package anna.pel.payload.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProductRequest {
    @NotBlank
    private String name;
    
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private Double formaldehydePercentage;
    
    @DecimalMin(value = "0.0")
    private Double price;
    
    @DecimalMin(value = "0.0")
    private Double cost;
    
    @NotBlank
    private String type;
    
    @NotBlank
    private String code;
    
    @NotBlank
    private String size;
    
    @Min(value = 0)
    private Integer currentStock;
    
    @Min(value = 0)
    private Integer minimumStock;
}