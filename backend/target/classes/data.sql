-- Inicialización de métodos de pago con IDs específicos
INSERT INTO payment_methods (id, name) VALUES (1, 'CASH') ON DUPLICATE KEY UPDATE name = 'CASH';
INSERT INTO payment_methods (id, name) VALUES (2, 'CARD') ON DUPLICATE KEY UPDATE name = 'CARD';
INSERT INTO payment_methods (id, name) VALUES (3, 'TRANSFER') ON DUPLICATE KEY UPDATE name = 'TRANSFER';