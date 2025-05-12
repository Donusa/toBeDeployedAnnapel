package anna.pel.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column
    private String address;

    @NotBlank
    @Column(nullable = false)
    private String phone;

    @Column
    private String dni;

    @Column
    private String email;

    @Column
    private Double currentAccount;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    @Column
    private Double discount;

    @NotBlank
    @Column(nullable = false)
    private String location;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
}