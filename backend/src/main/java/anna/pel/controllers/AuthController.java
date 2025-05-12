package anna.pel.controllers;

import anna.pel.model.User;
import anna.pel.payload.request.LoginRequest;
import anna.pel.payload.request.SignupRequest;
import anna.pel.payload.request.UpdateUserRequest;
import anna.pel.payload.response.JwtResponse;
import anna.pel.payload.response.MessageResponse;
import anna.pel.payload.response.UserResponse;
import anna.pel.repository.UserRepository;
import anna.pel.security.jwt.JwtUtils;
import anna.pel.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.getCommissionPercentage()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setCommissionPercentage(signUpRequest.getCommissionPercentage());

        String strRole = signUpRequest.getRole();
        User.Role role;

        if (strRole == null || strRole.isEmpty()) {
            role = User.Role.EMPLOYEE; // Default role
        } else {
            try {
                role = User.Role.valueOf(strRole.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid role specified."));
            }
        }

        user.setRole(role);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(UserResponse::new)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest updateRequest) {
        return userRepository.findById(id)
                .map(user -> {
                    if (updateRequest.getUsername() != null && 
                        !user.getUsername().equals(updateRequest.getUsername()) && 
                        userRepository.existsByUsername(updateRequest.getUsername())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Username is already taken!"));
                    }
                    
                    if (updateRequest.getEmail() != null && 
                        !user.getEmail().equals(updateRequest.getEmail()) && 
                        userRepository.existsByEmail(updateRequest.getEmail())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Email is already in use!"));
                    }
                    
                    if (updateRequest.getUsername() != null) {
                        user.setUsername(updateRequest.getUsername());
                    }
                    
                    if (updateRequest.getEmail() != null) {
                        user.setEmail(updateRequest.getEmail());
                    }
                    
                    if (updateRequest.getPassword() != null) {
                        user.setPassword(encoder.encode(updateRequest.getPassword()));
                    }
                    
                    if (updateRequest.getCommissionPercentage() != null) {
                        user.setCommissionPercentage(updateRequest.getCommissionPercentage());
                    }
                    
                    if (updateRequest.getRole() != null) {
                        try {
                            User.Role role = User.Role.valueOf(updateRequest.getRole().toUpperCase());
                            user.setRole(role);
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest()
                                    .body(new MessageResponse("Error: Invalid role specified."));
                        }
                    }
                    
                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(new UserResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}