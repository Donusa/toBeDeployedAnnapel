package anna.pel.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DailyCashRegisterResponse {
    private LocalDate date;
    
    // Products sold with quantities
    private List<ProductSoldInfo> productsSold;
    
    // Income by payment method
    private Double cashIncome;
    private Double cardIncome;
    private Double transferIncome;
    private Double totalIncome;
    
    // Commission information
    private Double commissionPercentage;
    private Double commissionAmount;
    
    // Shipping payments
    private Double shippingPayments;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductSoldInfo {
        private ProductResponse product;
        private Integer quantity;
        private Double totalAmount;
    }
}