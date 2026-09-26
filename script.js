let supabaseClient = null;


// ============================================================
// MOSTRAR MENSAGEM
// ============================================================

function mostrarMensagem(texto, tipo) {

    const mensagem = document.getElementById("mensagem");

    mensagem.textContent = texto;

    mensagem.className = "mensagem";

    if (tipo === "sucesso") {
        mensagem.classList.add("sucesso");
    }

    if (tipo === "erro") {
        mensagem.classList.add("erro");
    }

    mensagem.style.display = "block";

    setTimeout(() => {
        mensagem.style.display = "none";
    }, 5000);
}


// ============================================================
// CONECTAR AO SUPABASE
// ============================================================

async function inicializarSupabase() {

    const url = document
        .getElementById("supabase_url")
        .value
        .trim();

    const key = document
        .getElementById("supabase_key")
        .value
        .trim();


    if (!url || !key) {

        mostrarMensagem(
            "Informe a SUPABASE_URL e a SUPABASE_ANON_KEY.",
            "erro"
        );

        return;
    }


    try {

        supabaseClient = window.supabase.createClient(
            url,
            key
        );


        // Testa a conexão consultando a tabela
        const { error } = await supabaseClient
            .from("veiculos")
            .select("id")
            .limit(1);


        if (error) {

            console.error(error);

            atualizarStatus(false);

            mostrarMensagem(
                "Não foi possível conectar. Verifique a URL, a chave, a tabela e as Policies.",
                "erro"
            );

            return;
        }


        atualizarStatus(true);

        mostrarMensagem(
            "Conectado ao Supabase com sucesso!",
            "sucesso"
        );


        carregarVeiculos();

    } catch (erro) {

        console.error(erro);

        atualizarStatus(false);

        mostrarMensagem(
            "Erro ao conectar ao Supabase.",
            "erro"
        );
    }
}


// ============================================================
// STATUS DA CONEXÃO
// ============================================================

function atualizarStatus(conectado) {

    const status =
        document.getElementById("statusConexao");


    if (conectado) {

        status.textContent = "● Conectado";

        status.className =
            "conexao conectado";

    } else {

        status.textContent = "● Desconectado";

        status.className =
            "conexao desconectado";
    }
}


// ============================================================
// CADASTRAR / EDITAR
// ============================================================

document
    .getElementById("formVeiculo")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        if (!supabaseClient) {

            mostrarMensagem(
                "Primeiro conecte o sistema ao Supabase.",
                "erro"
            );

            return;
        }


        const id =
            document.getElementById("veiculo_id").value;


        const dados = {

            marca:
                document.getElementById("marca")
                    .value
                    .trim(),

            modelo:
                document.getElementById("modelo")
                    .value
                    .trim(),

            ano:
                Number(
                    document.getElementById("ano")
                        .value
                ),

            placa:
                document.getElementById("placa")
                    .value
                    .trim()
                    .toUpperCase(),

            cor:
                document.getElementById("cor")
                    .value
                    .trim() || null,

            status:
                document.getElementById("status")
                    .value,

            proprietario:
                document.getElementById("proprietario")
                    .value
                    .trim() || null,

            renavam:
                document.getElementById("renavam")
                    .value
                    .trim() || null,

            observacoes:
                document.getElementById("observacoes")
                    .value
                    .trim() || null
        };


        let resultado;


        // EDITAR
        if (id) {

            resultado =
                await supabaseClient
                    .from("veiculos")
                    .update(dados)
                    .eq("id", id);

        }

        // NOVO CADASTRO
        else {

            resultado =
                await supabaseClient
                    .from("veiculos")
                    .insert([dados]);
        }


        if (resultado.error) {

            console.error(resultado.error);

            mostrarMensagem(
                "Erro: " + resultado.error.message,
                "erro"
            );

            return;
        }


        mostrarMensagem(
            id
                ? "Veículo atualizado com sucesso!"
                : "Veículo cadastrado com sucesso!",
            "sucesso"
        );


        limparFormulario();

        carregarVeiculos();

    });


// ============================================================
// CARREGAR VEÍCULOS
// ============================================================

async function carregarVeiculos() {

    if (!supabaseClient) {
        return;
    }


    const lista =
        document.getElementById("listaVeiculos");


    lista.innerHTML = `
        <tr>
            <td colspan="7" class="sem-registros">
                Carregando veículos...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("veiculos")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="7" class="sem-registros">
                    Erro ao carregar veículos.
                </td>
            </tr>
        `;

        mostrarMensagem(
            error.message,
            "erro"
        );

        return;
    }


    if (!data || data.length === 0) {

        lista.innerHTML = `
            <tr>
                <td colspan="7" class="sem-registros">
                    Nenhum veículo cadastrado.
                </td>
            </tr>
        `;

        return;
    }


    lista.innerHTML = "";


    data.forEach(veiculo => {

        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>
                <strong>
                    ${escaparHTML(veiculo.marca)}
                </strong>

                <br>

                ${escaparHTML(veiculo.modelo)}
            </td>

            <td>
                ${veiculo.ano || "-"}
            </td>

            <td>
                <strong>
                    ${escaparHTML(veiculo.placa)}
                </strong>
            </td>

            <td>
                ${escaparHTML(veiculo.cor || "-")}
            </td>

            <td>
                ${escaparHTML(
                    veiculo.proprietario || "-"
                )}
            </td>

            <td>
                <span class="status ${veiculo.status}">
                    ${escaparHTML(
                        veiculo.status || "ativo"
                    )}
                </span>
            </td>

            <td>

                <div class="acoes">

                    <button
                        class="btn-editar"
                        onclick="editarVeiculo('${veiculo.id}')"
                    >
                        Editar
                    </button>

                    <button
                        class="btn-excluir"
                        onclick="excluirVeiculo('${veiculo.id}')"
                    >
                        Excluir
                    </button>

                </div>

            </td>
        `;


        lista.appendChild(linha);

    });

}


// ============================================================
// EDITAR VEÍCULO
// ============================================================

async function editarVeiculo(id) {

    if (!supabaseClient) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("veiculos")
            .select("*")
            .eq("id", id)
            .single();


    if (error) {

        mostrarMensagem(
            error.message,
            "erro"
        );

        return;
    }


    document.getElementById("veiculo_id").value =
        data.id;

    document.getElementById("marca").value =
        data.marca || "";

    document.getElementById("modelo").value =
        data.modelo || "";

    document.getElementById("ano").value =
        data.ano || "";

    document.getElementById("placa").value =
        data.placa || "";

    document.getElementById("cor").value =
        data.cor || "";

    document.getElementById("status").value =
        data.status || "ativo";

    document.getElementById("proprietario").value =
        data.proprietario || "";

    document.getElementById("renavam").value =
        data.renavam || "";

    document.getElementById("observacoes").value =
        data.observacoes || "";


    document.getElementById("tituloForm")
        .textContent =
        "Editar Veículo";


    document.getElementById("btnCancelar")
        .style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// EXCLUIR
// ============================================================

async function excluirVeiculo(id) {

    if (!supabaseClient) {
        return;
    }


    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este veículo?"
        );


    if (!confirmar) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("veiculos")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        mostrarMensagem(
            "Erro ao excluir: " +
            error.message,
            "erro"
        );

        return;
    }


    mostrarMensagem(
        "Veículo excluído com sucesso!",
        "sucesso"
    );


    carregarVeiculos();
}


// ============================================================
// CANCELAR EDIÇÃO
// ============================================================

function cancelarEdicao() {

    limparFormulario();

}


// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {

    document
        .getElementById("formVeiculo")
        .reset();


    document.getElementById("veiculo_id")
        .value = "";


    document.getElementById("tituloForm")
        .textContent =
        "Cadastrar Novo Veículo";


    document.getElementById("btnCancelar")
        .style.display =
        "none";


    document.getElementById("status")
        .value =
        "ativo";
}


// ============================================================
// SEGURANÇA CONTRA HTML INJETADO
// ============================================================

function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}