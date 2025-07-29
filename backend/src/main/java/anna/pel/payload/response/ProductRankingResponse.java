package anna.pel.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductRankingResponse {
    private ProductResponse product;
    private Integer totalQuantitySold;
    private Integer totalOrders;
    private Integer ranking;
}