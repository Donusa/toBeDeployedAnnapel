package anna.pel.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import anna.pel.model.PaymentMethod;
import anna.pel.repository.PaymentMethodRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Override
    public void run(String... args) throws Exception {
        // Inicializar métodos de pago predefinidos con IDs específicos
        initializePaymentMethods();
    }

    private void initializePaymentMethods() {
        // Verificar si ya existen métodos de pago
        if (paymentMethodRepository.count() == 0) {
            // Crear método de pago EFECTIVO con ID 1
            PaymentMethod cashMethod = new PaymentMethod();
            cashMethod.setId(1L);
            cashMethod.setName(PaymentMethod.CASH);
            paymentMethodRepository.save(cashMethod);
            
            // Crear método de pago TARJETA con ID 2
            PaymentMethod cardMethod = new PaymentMethod();
            cardMethod.setId(2L);
            cardMethod.setName(PaymentMethod.CARD);
            paymentMethodRepository.save(cardMethod);
            
            // Crear método de pago TRANSFERENCIA con ID 3
            PaymentMethod transferMethod = new PaymentMethod();
            transferMethod.setId(3L);
            transferMethod.setName(PaymentMethod.TRANSFER);
            paymentMethodRepository.save(transferMethod);
            
            System.out.println("Métodos de pago predefinidos inicializados correctamente.");
        } else {
            System.out.println("Los métodos de pago ya existen en la base de datos.");
        }
    }
}