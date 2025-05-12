package anna.pel.controllers;

import java.util.List;
import java.util.stream.Collectors;

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

import anna.pel.model.Product;
import anna.pel.payload.request.ProductRequest;
import anna.pel.payload.response.MessageResponse;
import anna.pel.payload.response.ProductResponse;
import anna.pel.repository.ProductRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest productRequest) {
        if (productRepository.existsByCode(productRequest.getCode())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Product code is already in use!"));
        }

        Product product = new Product();
        updateProductFromRequest(product, productRequest);
        
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(convertToResponse(savedProduct));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest productRequest) {
        return productRepository.findById(id)
                .map(product -> {
                    // Check if code is changed and already exists
                    if (!product.getCode().equals(productRequest.getCode()) && 
                        productRepository.existsByCode(productRequest.getCode())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Product code is already in use!"));
                    }
                    
                    updateProductFromRequest(product, productRequest);
                    Product updatedProduct = productRepository.save(product);
                    return ResponseEntity.ok(convertToResponse(updatedProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    productRepository.delete(product);
                    return ResponseEntity.ok(new MessageResponse("Product deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void updateProductFromRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setFormaldehydePercentage(request.getFormaldehydePercentage());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setType(request.getType());
        product.setCode(request.getCode());
        product.setSize(request.getSize());
        product.setCurrentStock(request.getCurrentStock());
        product.setMinimumStock(request.getMinimumStock());
    }

    private ProductResponse convertToResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getFormaldehydePercentage(),
                product.getPrice(),
                product.getCost(),
                product.getType(),
                product.getCode(),
                product.getSize(),
                product.getCurrentStock(),
                product.getMinimumStock()
        );
    }
}