package anna.pel.controllers;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import anna.pel.config.JacksonConfig;
import anna.pel.model.Client;
import anna.pel.model.Order;
import anna.pel.model.OrderItem;
import anna.pel.model.PaymentMethod;
import anna.pel.model.Product;
import anna.pel.model.User;
import anna.pel.repository.OrderRepository;
import anna.pel.repository.UserRepository;
import anna.pel.security.WebSecurityConfig;
import anna.pel.security.jwt.AuthEntryPointJwt;
import anna.pel.security.jwt.JwtUtils;
import anna.pel.security.services.UserDetailsServiceImpl;

@WebMvcTest(controllers = ReportController.class, properties = "spring.web.cors.allowed-origins=http://localhost:4200")
@Import({WebSecurityConfig.class, AuthEntryPointJwt.class, JacksonConfig.class})
@WithMockUser(username = "empleado", roles = "EMPLOYEE")
class CashRegisterRangeTests {
    @Autowired private MockMvc mvc;
    @MockBean private OrderRepository orderRepository;
    @MockBean private UserRepository userRepository;
    @MockBean private JwtUtils jwtUtils;
    @MockBean private UserDetailsServiceImpl userDetailsService;

    private final LocalDate start = LocalDate.of(2026, 10, 1);
    private final LocalDate end = LocalDate.of(2026, 10, 27);

    private Order order(long sellerId, LocalDate date, double price, int quantity,
            Double clientDiscount, Double customDiscount, String paymentMethod, double commission) {
        User seller = new User();
        seller.setId(sellerId);
        seller.setUsername("empleado" + sellerId);
        seller.setRole(User.Role.EMPLOYEE);
        seller.setCommissionPercentage(commission);
        Client client = new Client();
        client.setId(sellerId);
        client.setDiscount(clientDiscount);
        Product product = new Product();
        product.setId(1L);
        product.setName("Producto");
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setPrice(price);
        item.setQuantity(quantity);
        item.calculateSubtotal();
        Order order = new Order();
        order.setId(sellerId);
        order.setSeller(seller);
        order.setClient(client);
        order.setOrderDate(date);
        order.setOrderItems(List.of(item));
        order.setCustomDiscount(customDiscount);
        order.setShippingCost(50.0);
        if (paymentMethod != null) {
            order.setPaymentMethod(new PaymentMethod(1L, paymentMethod));
        }
        return order;
    }

    @Test
    void employeeCanSeeTotalsForAllSellersAndBothRangeBoundaries() throws Exception {
        // Orders on the first and last days belong to different employees.
        when(orderRepository.findByOrderDateBetween(start, end)).thenReturn(List.of(
                order(1, start, 100, 2, 10.0, null, PaymentMethod.CASH, 10),
                order(2, end, 150, 2, 30.0, 20.0, PaymentMethod.CARD, 5)));

        mvc.perform(get("/api/reports/daily-cash-register")
                .param("startDate", start.toString()).param("endDate", end.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startDate").value(start.toString()))
                .andExpect(jsonPath("$.endDate").value(end.toString()))
                .andExpect(jsonPath("$.date").value(nullValue()))
                .andExpect(jsonPath("$.grossIncome").value(500.0))
                .andExpect(jsonPath("$.discountAmount").value(80.0))
                .andExpect(jsonPath("$.netIncome").value(420.0))
                .andExpect(jsonPath("$.totalIncome").value(420.0))
                .andExpect(jsonPath("$.cashIncome").value(180.0))
                .andExpect(jsonPath("$.cardIncome").value(240.0))
                .andExpect(jsonPath("$.transferIncome").value(0.0))
                .andExpect(jsonPath("$.commissionAmount").value(30.0))
                .andExpect(jsonPath("$.shippingPayments").value(100.0))
                .andExpect(jsonPath("$.productsSold", hasSize(1)))
                .andExpect(jsonPath("$.productsSold[0].quantity").value(4))
                .andExpect(jsonPath("$.productsSold[0].totalAmount").value(420.0));
        verify(orderRepository).findByOrderDateBetween(start, end);
    }

    @Test
    void netIncludesUnspecifiedAndOtherPaymentMethods() throws Exception {
        when(orderRepository.findByOrderDateBetween(start, end)).thenReturn(List.of(
                order(1, start, 100, 1, null, null, null, 0),
                order(2, end, 200, 1, 10.0, 0.0, "OTHER", 0)));

        mvc.perform(get("/api/reports/daily-cash-register")
                .param("startDate", start.toString()).param("endDate", end.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossIncome").value(300.0))
                .andExpect(jsonPath("$.netIncome").value(300.0))
                .andExpect(jsonPath("$.discountAmount").value(0.0))
                .andExpect(jsonPath("$.cashIncome").value(0.0))
                .andExpect(jsonPath("$.cardIncome").value(0.0))
                .andExpect(jsonPath("$.transferIncome").value(0.0));
    }

    @Test
    void emptyRangeReturnsZeroTotals() throws Exception {
        when(orderRepository.findByOrderDateBetween(start, end)).thenReturn(List.of());
        mvc.perform(get("/api/reports/daily-cash-register")
                .param("startDate", start.toString()).param("endDate", end.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossIncome").value(0.0))
                .andExpect(jsonPath("$.netIncome").value(0.0))
                .andExpect(jsonPath("$.discountAmount").value(0.0))
                .andExpect(jsonPath("$.commissionAmount").value(0.0))
                .andExpect(jsonPath("$.productsSold", hasSize(0)));
    }

    @Test
    void legacyDateRequestStillReturnsDailyTotals() throws Exception {
        when(orderRepository.findByOrderDate(start)).thenReturn(List.of(
                order(1, start, 100, 1, 10.0, null, PaymentMethod.TRANSFER, 10)));
        mvc.perform(get("/api/reports/daily-cash-register").param("date", start.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(start.toString()))
                .andExpect(jsonPath("$.startDate").value(start.toString()))
                .andExpect(jsonPath("$.endDate").value(start.toString()))
                .andExpect(jsonPath("$.grossIncome").value(100.0))
                .andExpect(jsonPath("$.netIncome").value(90.0));
        verify(orderRepository).findByOrderDate(start);
    }

    @Test
    void rangeCanContainASingleDay() throws Exception {
        when(orderRepository.findByOrderDateBetween(start, start)).thenReturn(List.of());
        mvc.perform(get("/api/reports/daily-cash-register")
                .param("startDate", start.toString()).param("endDate", start.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(start.toString()));
        verify(orderRepository).findByOrderDateBetween(start, start);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "", "?startDate=2026-10-01", "?endDate=2026-10-27",
            "?startDate=2026-10-27&endDate=2026-10-01",
            "?startDate=2026-02-30&endDate=2026-10-27",
            "?date=2026-10-01&startDate=2026-10-01&endDate=2026-10-27"
    })
    void rejectsInvalidCashDateRanges(String query) throws Exception {
        mvc.perform(get("/api/reports/daily-cash-register" + query))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(orderRepository);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "?startDate=2026-10-01", "?endDate=2026-10-27",
            "?startDate=2026-10-27&endDate=2026-10-01"
    })
    void rejectsInvalidUserSalesDateRanges(String query) throws Exception {
        mvc.perform(get("/api/reports/user-sales" + query)).andExpect(status().isBadRequest());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void userSalesUsesTheSameExplicitRange() throws Exception {
        when(orderRepository.findByOrderDateBetween(start, end)).thenReturn(List.of(
                order(1, start, 100, 1, 10.0, null, PaymentMethod.CASH, 10),
                order(2, end, 200, 1, null, 20.0, PaymentMethod.CARD, 10)));
        mvc.perform(get("/api/reports/user-sales")
                .param("startDate", start.toString()).param("endDate", end.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].date").value(end.toString()))
                .andExpect(jsonPath("$[0].totalSales").value(160.0))
                .andExpect(jsonPath("$[1].date").value(start.toString()))
                .andExpect(jsonPath("$[1].totalSales").value(90.0));
        verify(orderRepository).findByOrderDateBetween(start, end);
    }
}
