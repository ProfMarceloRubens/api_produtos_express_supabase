/**
 ==========================================================
 MANTENDO A POO NO FRONTEND (ABSTRAÇÃO)
 ==========================================================
 A classe Produto continua existindo no frontend, ela ainda serve 
 para validar os dados na tela antes de enviar para o servidor e 
 para organizar o objeto
 */
 class Produto {
  #preco;
  #quantidade;

  constructor(nome, preco, quantidade, id = null) {
    if (!nome || preco <= 0 || quantidade <= 0) {
      throw new Error("Dados inválidos para o produto.");
    }
    this.id = id;
    this.nome = nome;
    this.#preco = parseFloat(preco);
    this.#quantidade = parseInt(quantidade, 10);
  }

  get preco() {
    return this.#preco;
  }

  get quantidade() {
    return this.#quantidade;
  }

  valorTotal() {
    return this.#preco * this.#quantidade;
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.#preco,
      quantidade: this.#quantidade
    };
  }
}

const API_URL = "http://localhost:3000/produtos";

// REQUISIÇÃO POST - Enviar dados ao servidor
document.getElementById("produto-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const preco = document.getElementById("preco").value;
  const quantidade = document.getElementById("quantidade").value;

  try {
    const novoProduto = new Produto(nome, preco, quantidade);

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoProduto.toJSON())
    });

    if (!resposta.ok) {
      throw new Error("Erro ao salvar o produto no servidor backend.");
    }

    renderizarTabela();
    e.target.reset();
  } catch (erro) {
    alert(erro.message);
  }
});

// REQUISIÇÃO GET - Buscar e desenhar a tabela com a nova coluna de Ações
async function renderizarTabela() {
  try {
    const resposta = await fetch(API_URL);
    const dadosBrutosDoServidor = await resposta.json();

    const tabela = document.querySelector("#tabela-produtos tbody");
    tabela.innerHTML = ""; 

    let totalAcumulado = 0;

    dadosBrutosDoServidor.forEach((dados) => {
      const produto = new Produto(dados.nome, dados.preco, dados.quantidade, dados.id);
      totalAcumulado += produto.valorTotal();

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${produto.nome}</td>
        <td>R$ ${produto.preco.toFixed(2)}</td>
        <td>${produto.quantidade}</td>
        <td>R$ ${produto.valorTotal().toFixed(2)}</td>
        <td>
          <button class="btn-excluir" onclick="excluirProduto('${produto.id}')">Excluir</button>
        </td>
      `;
      tabela.appendChild(row);
    });

    document.getElementById("total-estoque").textContent = `Total em estoque: R$ ${totalAcumulado.toFixed(2)}`;
  } catch (erro) {
    console.error("Erro ao buscar dados no servidor:", erro);
  }
}

// REQUISIÇÃO DELETE - Apagar produto individual
async function excluirProduto(id) {
  if (confirm("Deseja realmente excluir este produto?")) {
    try {
      const resposta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir o produto do servidor.");
      }

      renderizarTabela();
    } catch (erro) {
      console.error("Erro ao excluir produto:", erro);
    }
  }
}

// REQUISIÇÃO DELETE - Apagar todos os dados em lote
document.getElementById("limpar-tabela").addEventListener("click", async function () {
  if (confirm("Deseja mesmo limpar toda a tabela no servidor?")) {
    try {
      await fetch(API_URL, { method: "DELETE" });
      renderizarTabela();
    } catch (erro) {
      console.error("Erro ao limpar dados no servidor:", erro);
    }
  }
});

// INICIALIZAÇÃO AUTOMÁTICA
renderizarTabela();