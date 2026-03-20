package br.com.emanuel.embaixadores_backend.config;

import br.com.emanuel.embaixadores_backend.entity.Endereco;
import br.com.emanuel.embaixadores_backend.entity.Usuario;
import br.com.emanuel.embaixadores_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepo;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Cria admin padrão se não existir
        if (usuarioRepo.findByEmail("admin@embaixadores.com").isEmpty()) {
            Usuario admin = Usuario.builder()
                    .numeroInscricao(1L)
                    .nome("Administrador")
                    .email("admin@embaixadores.com")
                    .senha(passwordEncoder.encode("admin123"))
                    .cpf("000.000.000-00")
                    .dataNascimento(LocalDate.of(1990, 1, 1))
                    .role("ADMIN")
                    .status("EMBAIXADOR")
                    .codigoIndicacao("EMB-0001")
                    .embaixadorConfirmado(true)
                    .jaLogouAntes(true)
                    .endereco(Endereco.builder()
                            .rua("Rua Admin").numero("1").bairro("Centro")
                            .cep("00000-000").cidade("São Paulo").estado("São Paulo").pais("Brasil")
                            .build())
                    .build();
            usuarioRepo.save(admin);
            System.out.println(">>> Admin padrão criado: admin@embaixadores.com / admin123");
        }
    }
}
