package anna.pel.payload.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCommissionResponse {
	private UserResponse user;
	private List<OrderResponse> orders;
	private Double totalSales;
	private Double totalCommission;
}
