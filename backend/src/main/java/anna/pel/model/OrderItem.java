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
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Column(nullable = false)
    private Integer quantity = 1;
    
    @DecimalMin(value = "0.0")
    @Column(nullable = false)
    private Double price = 0.0;
    
    @DecimalMin(value = "0.0")
    @Column(nullable = false)
    private Double subtotal = 0.0;
    
    @PrePersist
    @PreUpdate
    public void calculateSubtotal() {
        this.subtotal = this.price * this.quantity;
    }
}