package anna.pel.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import anna.pel.model.PaymentMethod;
import anna.pel.payload.response.MessageResponse;
import anna.pel.repository.PaymentMethodRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @GetMapping
    public ResponseEntity<List<PaymentMethod>> getAllPaymentMethods() {
        List<PaymentMethod> paymentMethods = paymentMethodRepository.findAll();
        return ResponseEntity.ok(paymentMethods);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPaymentMethodById(@PathVariable Long id) {
        return paymentMethodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPaymentMethod(@Valid @RequestBody PaymentMethod paymentMethod) {
        if (paymentMethodRepository.findByName(paymentMethod.getName()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Payment method name is already in use!"));
        }

        PaymentMethod savedPaymentMethod = paymentMethodRepository.save(paymentMethod);
        return ResponseEntity.ok(savedPaymentMethod);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePaymentMethod(@PathVariable Long id, @Valid @RequestBody PaymentMethod paymentMethodRequest) {
        return paymentMethodRepository.findById(id)
                .map(paymentMethod -> {
                    // Check if name is changed and already exists
                    if (!paymentMethod.getName().equals(paymentMethodRequest.getName()) && 
                        paymentMethodRepository.findByName(paymentMethodRequest.getName()).isPresent()) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Payment method name is already in use!"));
                    }
                    
                    paymentMethod.setName(paymentMethodRequest.getName());
                    PaymentMethod updatedPaymentMethod = paymentMethodRepository.save(paymentMethod);
                    return ResponseEntity.ok(updatedPaymentMethod);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePaymentMethod(@PathVariable Long id) {
        return paymentMethodRepository.findById(id)
                .map(paymentMethod -> {
                    paymentMethodRepository.delete(paymentMethod);
                    return ResponseEntity.ok(new MessageResponse("Payment method deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}