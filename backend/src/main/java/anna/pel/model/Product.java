package anna.pel.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    @Column(nullable = false)
    private Double formaldehydePercentage;

    @DecimalMin(value = "0.0")
    @Column(nullable = false)
    private Double price;

    @DecimalMin(value = "0.0")
    @Column(nullable = false)
    private Double cost;

    @NotBlank
    @Column(nullable = false)
    private String type;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String code;

    @NotBlank
    @Column(nullable = false)
    private String size;

    @Min(value = 0)
    @Column(nullable = false)
    private Integer currentStock;

    @Min(value = 0)
    @Column(nullable = false)
    private Integer minimumStock;
}