package anna.pel.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String role;
    private Double commissionPercentage;
    
    public JwtResponse(String token, Long id, String username, String email, String role, Double commissionPercentage) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.commissionPercentage = commissionPercentage;
    }
}