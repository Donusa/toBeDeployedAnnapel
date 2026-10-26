package anna.pel.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import anna.pel.config.JacksonConfig;
import anna.pel.model.Client;
import anna.pel.model.Order;
import anna.pel.model.Product;
import anna.pel.model.User;
import anna.pel.repository.ClientRepository;
import anna.pel.repository.OrderRepository;
import anna.pel.repository.PaymentMethodRepository;
import anna.pel.repository.ProductRepository;
import anna.pel.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class OrderDateTests {
    @Mock private OrderRepository orderRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PaymentMethodRepository paymentMethodRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private OrderController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new JacksonConfig().objectMapper()))
                .build();
    }

    private void prepareRepositories() {
        Client client = new Client();
        client.setId(1L);
        User seller = new User();
        seller.setId(2L);
        seller.setRole(User.Role.ADMIN);
        Product product = new Product();
        product.setId(3L);
        product.setCurrentStock(10);
        product.setPrice(100.0);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(userRepository.findById(2L)).thenReturn(Optional.of(seller));
        when(productRepository.findById(3L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private String requestBody(String orderDate) {
        return requestBody(orderDate, "");
    }

    private String requestBody(String orderDate, String deliveryDateField) {
        String dateField = orderDate == null ? "" : ",\"orderDate\":\"" + orderDate + "\"";
        return """
                {"clientId":1,"sellerId":2,"orderItems":[{"productId":3,"quantity":1}],
                 "shippingMethod":"RETIRA_SIN_COSTO","paid":true%s%s}
                """.formatted(dateField, deliveryDateField);
    }

    private void assertSavedDate(String expectedDate) {
        ArgumentCaptor<Order> savedOrder = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(savedOrder.capture());
        assertEquals(LocalDate.parse(expectedDate), savedOrder.getValue().getOrderDate());
    }

    private void assertSavedWithoutDeliveryDate() {
        ArgumentCaptor<Order> savedOrder = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(savedOrder.capture());
        assertNull(savedOrder.getValue().getDeliveryDate());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void createsOrderWithoutDeliveryDate(boolean explicitNull) throws Exception {
        prepareRepositories();
        String body = requestBody("2026-10-20", explicitNull ? ",\"deliveryDate\":null" : "");
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryDate").value(nullValue()));
        assertSavedWithoutDeliveryDate();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void clearsDeliveryDateWhenUpdateLeavesItEmpty(boolean explicitNull) throws Exception {
        prepareRepositories();
        Order order = new Order();
        order.setDeliveryDate(LocalDate.of(2026, 11, 1));
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));
        String body = requestBody("2026-10-20", explicitNull ? ",\"deliveryDate\":null" : "");
        mvc.perform(put("/api/orders/4").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryDate").value(nullValue()));
        assertSavedWithoutDeliveryDate();
    }

    @ParameterizedTest
    @ValueSource(strings = {"2000-02-29", "2099-12-31"})
    void createsOrderWithSelectedDate(String date) throws Exception {
        prepareRepositories();
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(requestBody(date)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderDate").value(date));
        assertSavedDate(date);
    }

    @Test
    void defaultsToTodayWhenCreateOmitsDate() throws Exception {
        prepareRepositories();
        String today = LocalDate.now().toString();
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(requestBody(null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderDate").value(today));
        assertSavedDate(today);
    }

    @ParameterizedTest
    @ValueSource(strings = {"2000-02-29", "2099-12-31"})
    void updatesOrderWithSelectedDate(String date) throws Exception {
        prepareRepositories();
        when(orderRepository.findById(4L)).thenReturn(Optional.of(new Order()));
        mvc.perform(put("/api/orders/4").contentType(MediaType.APPLICATION_JSON).content(requestBody(date)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderDate").value(date));
        assertSavedDate(date);
    }

    @Test
    void preservesExistingDateWhenUpdateOmitsDate() throws Exception {
        prepareRepositories();
        Order order = new Order();
        order.setOrderDate(LocalDate.of(2020, 5, 15));
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));
        mvc.perform(put("/api/orders/4").contentType(MediaType.APPLICATION_JSON).content(requestBody(null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderDate").value("2020-05-15"));
        assertSavedDate("2020-05-15");
    }

    @Test
    void rejectsMalformedDate() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(requestBody("not-a-date")))
                .andExpect(status().isBadRequest());
    }
}
