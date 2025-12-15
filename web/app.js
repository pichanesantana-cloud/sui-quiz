// Perguntas do quiz: 10 perguntas, 4 opções, 1 correta
// Cobrem: finanças básicas, poupança, blockchain, descentralização vs centralização,
// tokens e economia, e características da rede Sui.

const questions = [
  {
    q: "O que é um blockchain?",
    options: [
      "Um banco de dados central controlado por uma única empresa",
      "Um livro-razão distribuído e imutável mantido por vários participantes",
      "Um aplicativo de mensagens entre pares",
      "Um servidor web que hospeda sites"
    ],
    correct: 1
  },
  {
    q: "Por que a descentralização é importante?",
    options: [
      "Para reduzir redundância e aumentar pontos únicos de falha",
      "Para concentrar poder e controle",
      "Para diminuir transparência",
      "Para reduzir censura e pontos únicos de falha"
    ],
    correct: 3
  },
  {
    q: "Qual é a diferença principal entre sistemas centralizados e descentralizados?",
    options: [
      "Centralizados têm múltiplos validadores independentes",
      "Descentralizados dependem de uma autoridade única",
      "Centralizados têm uma autoridade central; descentralizados distribuem controle",
      "Não há diferença"
    ],
    correct: 2
  },
  {
    q: "Qual prática ajuda a poupar dinheiro de forma consistente?",
    options: [
      "Gastar primeiro e poupar o que sobrar",
      "Pagar-se primeiro, automatizando uma transferência para poupança",
      "Comprar itens parcelados para aumentar crédito",
      "Evitar qualquer orçamento"
    ],
    correct: 1
  },
  {
    q: "O que é um token em blockchain?",
    options: [
      "Um arquivo de texto simples",
      "Uma representação digital de valor ou utilidade em uma rede",
      "Um endereço IP",
      "Um bug de software"
    ],
    correct: 1
  },
  {
    q: "Qual é um benefício da transparência em blockchains?",
    options: [
      "Permite auditoria pública de transações",
      "Oculta dados de todas as partes",
      "Elimina necessidade de segurança",
      "Evita qualquer responsabilidade"
    ],
    correct: 0
  },
  {
    q: "Qual é uma característica-chave da rede Sui?",
    options: [
      "Transações sequenciais apenas",
      "Execução paralela de transações quando não há conflitos",
      "Uso de Solidity como linguagem principal",
      "Ausência de objetos"
    ],
    correct: 1
  },
  {
    q: "Que linguagem Sui utiliza para contratos inteligentes?",
    options: ["Solidity", "Rust", "Move", "Python"],
    correct: 2
  },
  {
    q: "Na Sui, qual conceito facilita escalabilidade?",
    options: [
      "Estado global monolítico",
      "Modelo orientado a objetos com ownership",
      "Sharding rígido sempre",
      "Geração de blocos lenta"
    ],
    correct: 1
  },
  {
    q: "Qual é um caso de uso típico para Sui?",
    options: [
      "Jogos e NFTs com interação rica",
      "Somente bancos tradicionais",
      "Somente redes privadas",
      "Hospedagem de e-mails"
    ],
    correct: 0
  }
];

// Gera a UI das perguntas de forma acessível
const questionsContainer = document.getElementById("questions");
const form = document.getElementById("quiz-form");
const resultEl = document.getElementById("result");
const rewardEl = document.getElementById("reward");
const resetBtn = document.getElementById("reset-btn");
const connectBtn = document.getElementById("connect-btn");
const walletAddressEl = document.getElementById("wallet-address");
const networkSelect = document.getElementById("network-select");
const packageIdInput = document.getElementById("package-id");
const adminCapIdInput = document.getElementById("admincap-id");

let suiLibsLoaded = false;
let SuiClientRef = null;
let getFullnodeUrlRef = null;
let TransactionRef = null;
let client = null;
let wallet = null;
let walletAddress = null;

async function ensureSuiLibs() {
  if (suiLibsLoaded) return;
  const clientMod = await import('https://esm.run/@mysten/sui.js/client');
  const txMod = await import('https://esm.run/@mysten/sui.js/transactions');
  SuiClientRef = clientMod.SuiClient;
  getFullnodeUrlRef = clientMod.getFullnodeUrl;
  TransactionRef = txMod.Transaction;
  suiLibsLoaded = true;
}

async function initClient() {
  await ensureSuiLibs();
  const net = networkSelect?.value || 'testnet';
  client = new SuiClientRef({ url: getFullnodeUrlRef(net) });
}

function getInjectedWallet() {
  return window.suiWallet || window.sui || null;
}

async function connectWallet() {
  wallet = getInjectedWallet();
  if (!wallet) {
    alert('Nenhuma carteira Sui encontrada. Instale Sui Wallet (extensão) e tente novamente.');
    return;
  }
  try {
    if (wallet.requestPermissions) {
      await wallet.requestPermissions({ permissions: ['viewAccount', 'suggestTransactions', 'signAndExecuteTransactionBlock'] });
    } else if (wallet.request) {
      await wallet.request({ method: 'wallet_requestPermissions', params: [{ permissions: ['viewAccount', 'suggestTransactions', 'signAndExecuteTransactionBlock'] }] });
    }
    const accounts = wallet.getAccounts ? await wallet.getAccounts() : (await wallet.request({ method: 'wallet_getAccounts' }));
    walletAddress = (accounts && accounts[0] && (accounts[0].address || accounts[0])) || null;
    walletAddressEl.textContent = walletAddress ? `Conectado: ${walletAddress}` : '';
  } catch (e) {
    console.error(e);
    alert('Falha ao conectar carteira: ' + (e?.message || e));
  }
}

async function mintBadgeOnChain(score, total) {
  await initClient();
  if (!wallet || !walletAddress) {
    alert('Conecte uma carteira Sui antes de cunhar o badge.');
    return;
  }
  const packageId = packageIdInput.value.trim();
  const adminCapId = adminCapIdInput.value.trim();
  if (!packageId || !adminCapId) {
    alert('Informe Package ID e AdminCap Object ID nas configurações.');
    return;
  }
  try {
    const tx = new TransactionRef();
    tx.moveCall({
      target: `${packageId}::quiz::mint_badge`,
      arguments: [
        tx.object(adminCapId),
        tx.pure.address(walletAddress),
        tx.pure.u8(score),
        tx.pure.u8(total)
      ]
    });

    const bytes = await tx.build({ client });
    const base64 = btoa(String.fromCharCode(...bytes));

    let result;
    if (wallet.signAndExecuteTransactionBlock) {
      result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: base64,
        options: { showEffects: true, showEvents: true, showObjectChanges: true }
      });
    } else if (wallet.request) {
      result = await wallet.request({
        method: 'sui_signAndExecuteTransactionBlock',
        params: [{ transactionBlock: base64, options: { showEffects: true, showEvents: true, showObjectChanges: true } }]
      });
    } else {
      throw new Error('A carteira não suporta assinatura de transação programável.');
    }

    const digest = result?.digest || result?.effects?.transactionDigest || 'desconhecido';
    const ok = document.createElement('p');
    ok.className = 'feedback';
    ok.textContent = `Badge cunhado! Tx digest: ${digest}`;
    rewardEl.appendChild(ok);
  } catch (e) {
    console.error(e);
    const err = document.createElement('p');
    err.className = 'feedback';
    err.style.color = 'var(--danger)';
    err.textContent = 'Erro ao cunhar badge: ' + (e?.message || e);
    rewardEl.appendChild(err);
  }
}

function renderQuestions() {
  questionsContainer.innerHTML = "";
  questions.forEach((item, idx) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";

    const legend = document.createElement("legend");
    legend.textContent = `${idx + 1}. ${item.q}`;
    fieldset.appendChild(legend);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    item.options.forEach((opt, optIdx) => {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${idx}`;
      input.value = String(optIdx);
      input.required = true;
      const span = document.createElement("span");
      span.textContent = opt;

      label.appendChild(input);
      label.appendChild(span);
      optionsDiv.appendChild(label);
    });

    fieldset.appendChild(optionsDiv);
    questionsContainer.appendChild(fieldset);
  });
}

function computeScore(formData) {
  let score = 0;
  questions.forEach((item, idx) => {
    const v = Number(formData.get(`q${idx}`));
    if (v === item.correct) score++;
  });
  return score;
}

function feedbackFor(score, total) {
  const ratio = score / total;
  if (ratio === 1) return "Perfeito! Você acertou todas as perguntas.";
  if (ratio >= 0.8) return "Ótimo! Você acertou a maioria. Continue assim!";
  if (ratio >= 0.5) return "Bom começo! Reveja os conceitos para melhorar.";
  return "Tudo bem! Aprender é um processo. Tente novamente e avance.";
}

function maybeShowReward(score, total) {
  rewardEl.hidden = true;
  rewardEl.innerHTML = "";
  const threshold = 8;
  if (score >= threshold) {
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.innerHTML = `<span class="dot"></span> Parabéns! Você ganhou o badge "Sui Savvy"`;
    const hint = document.createElement("p");
    hint.className = "feedback";
    hint.textContent = "Opcional: conecte uma carteira Sui para cunhar um badge on-chain.";
    rewardEl.appendChild(badge);
    rewardEl.appendChild(hint);
    const actions = document.createElement('div');
    actions.className = 'actions';
    const mintBtn = document.createElement('button');
    mintBtn.type = 'button';
    mintBtn.className = 'btn primary';
    mintBtn.textContent = 'Cunhar badge on-chain';
    mintBtn.addEventListener('click', () => mintBadgeOnChain(score, total));
    actions.appendChild(mintBtn);
    rewardEl.appendChild(actions);
    rewardEl.hidden = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const total = questions.length;
  const score = computeScore(formData);

  resultEl.innerHTML = `
    <div class="score">Pontuação: ${score}/${total}</div>
    <div class="feedback">${feedbackFor(score, total)}</div>
  `;

  maybeShowReward(score, total);
});

resetBtn.addEventListener("click", () => {
  form.reset();
  resultEl.innerHTML = "";
  rewardEl.hidden = true;
  rewardEl.innerHTML = "";
});

renderQuestions();

connectBtn?.addEventListener('click', connectWallet);
networkSelect?.addEventListener('change', () => { client = null; });
