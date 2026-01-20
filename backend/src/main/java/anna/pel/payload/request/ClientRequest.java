package anna.pel.payload.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ClientRequest {
    @NotBlank
    private String name;
    
    private String address;
    
    @NotBlank
    private String phone;
    
    private String dni;
    
    private String email;
    
    private Double currentAccount;
    
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private Double discount;
    
    @NotBlank
    private String location;
}