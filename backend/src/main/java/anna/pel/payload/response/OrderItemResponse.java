package anna.pel.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productCode;
    private Integer quantity;
    private Double price;
    private Double subtotal;
    private ProductResponse product;
}