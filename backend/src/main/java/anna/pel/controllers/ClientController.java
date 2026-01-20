package anna.pel.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import anna.pel.model.Client;
import anna.pel.payload.request.ClientRequest;
import anna.pel.payload.response.ClientResponse;
import anna.pel.payload.response.MessageResponse;
import anna.pel.repository.ClientRepository;
import jakarta.validation.Valid;
@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientRepository clientRepository;

    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAllClients() {
        List<ClientResponse> clients = clientRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable Long id) {
        return clientRepository.findById(id)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createClient(@Valid @RequestBody ClientRequest clientRequest) {
        if (clientRequest.getDni() != null && clientRepository.existsByDni(clientRequest.getDni())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: DNI is already in use!"));
        }

        if (clientRequest.getEmail() != null && clientRepository.existsByEmail(clientRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        Client client = new Client();
        updateClientFromRequest(client, clientRequest);
        
        Client savedClient = clientRepository.save(client);
        return ResponseEntity.ok(convertToResponse(savedClient));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @Valid @RequestBody ClientRequest clientRequest) {
        return clientRepository.findById(id)
                .map(client -> {
                    // Check if DNI is changed and already exists
                    if (clientRequest.getDni() != null && 
                        (client.getDni() == null || !client.getDni().equals(clientRequest.getDni())) && 
                        clientRepository.existsByDni(clientRequest.getDni())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: DNI is already in use!"));
                    }
                    
                    // Check if email is changed and already exists
                    if (clientRequest.getEmail() != null && 
                        (client.getEmail() == null || !client.getEmail().equals(clientRequest.getEmail())) && 
                        clientRepository.existsByEmail(clientRequest.getEmail())) {
                        return ResponseEntity.badRequest()
                                .body(new MessageResponse("Error: Email is already in use!"));
                    }
                    
                    updateClientFromRequest(client, clientRequest);
                    Client updatedClient = clientRepository.save(client);
                    return ResponseEntity.ok(convertToResponse(updatedClient));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable Long id) {
        return clientRepository.findById(id)
                .map(client -> {
                    clientRepository.delete(client);
                    return ResponseEntity.ok(new MessageResponse("Client deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void updateClientFromRequest(Client client, ClientRequest request) {
        client.setName(request.getName());
        client.setAddress(request.getAddress());
        client.setPhone(request.getPhone());
        client.setDni(request.getDni());
        client.setEmail(request.getEmail());
        client.setCurrentAccount(request.getCurrentAccount());
        client.setDiscount(request.getDiscount());
        client.setLocation(request.getLocation());
    }

    private ClientResponse convertToResponse(Client client) {
        return new ClientResponse(
                client.getId(),
                client.getName(),
                client.getAddress(),
                client.getPhone(),
                client.getDni(),
                client.getEmail(),
                client.getCurrentAccount(),
                client.getDiscount(),
                client.getLocation()
        );
    }
}