package anna.pel.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @Column(nullable = false)
    private LocalDate orderDate = LocalDate.now();
    
    @Column
    private LocalDate deliveryDate;
    
    @Column(nullable = false)
    private Boolean delivered = false;
    
    @Column(nullable = false)
    private Boolean paid = false;
    
    @DecimalMin(value = "0.0")
    @Column(nullable = false)
    private Double amountDue = 0.0;
    
    @NotBlank
    @Column(nullable = false)
    private String shippingMethod;
    
    @ManyToOne
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;
    
    @Column(nullable = false)
    private Double shippingCost = 0.0;
    
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    @Column
    private Double customDiscount;
}