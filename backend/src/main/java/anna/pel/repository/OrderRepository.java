package anna.pel.repository;

import anna.pel.model.Order;
import anna.pel.model.Client;
import anna.pel.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
	
    List<Order> findByClient(Client client);
    List<Order> findBySeller(User seller);
    List<Order> findByDeliveryDate(LocalDate deliveryDate);
    List<Order> findByDelivered(Boolean delivered);
    List<Order> findByPaid(Boolean paid);
    List<Order> findByOrderDate(LocalDate startDate);
    List<Order> findByOrderDateBetween(LocalDate startDate, LocalDate endDate);
}