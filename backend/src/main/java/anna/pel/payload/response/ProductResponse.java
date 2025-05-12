package anna.pel.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private Double formaldehydePercentage;
    private Double price;
    private Double cost;
    private String type;
    private String code;
    private String size;
    private Integer currentStock;
    private Integer minimumStock;
}