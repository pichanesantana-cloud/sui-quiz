import { useMemo, useState } from 'react'
import './App.css'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

const questions = [
  { q: 'O que é um blockchain?', options: ['Um banco de dados central controlado por uma única empresa', 'Um livro-razão distribuído e imutável mantido por vários participantes', 'Um aplicativo de mensagens entre pares', 'Um servidor web que hospeda sites'], correct: 1 },
  { q: 'Por que a descentralização é importante?', options: ['Para reduzir redundância e aumentar pontos únicos de falha', 'Para concentrar poder e controle', 'Para diminuir transparência', 'Para reduzir censura e pontos únicos de falha'], correct: 3 },
  { q: 'Qual é a diferença principal entre sistemas centralizados e descentralizados?', options: ['Centralizados têm múltiplos validadores independentes', 'Descentralizados dependem de uma autoridade única', 'Centralizados têm uma autoridade central; descentralizados distribuem controle', 'Não há diferença'], correct: 2 },
  { q: 'Qual prática ajuda a poupar dinheiro de forma consistente?', options: ['Gastar primeiro e poupar o que sobrar', 'Pagar-se primeiro, automatizando uma transferência para poupança', 'Comprar itens parcelados para aumentar crédito', 'Evitar qualquer orçamento'], correct: 1 },
  { q: 'O que é um token em blockchain?', options: ['Um arquivo de texto simples', 'Uma representação digital de valor ou utilidade em uma rede', 'Um endereço IP', 'Um bug de software'], correct: 1 },
  { q: 'Qual é um benefício da transparência em blockchains?', options: ['Permite auditoria pública de transações', 'Oculta dados de todas as partes', 'Elimina necessidade de segurança', 'Evita qualquer responsabilidade'], correct: 0 },
  { q: 'Qual é uma característica-chave da rede Sui?', options: ['Transações sequenciais apenas', 'Execução paralela de transações quando não há conflitos', 'Uso de Solidity como linguagem principal', 'Ausência de objetos'], correct: 1 },
  { q: 'Que linguagem Sui utiliza para contratos inteligentes?', options: ['Solidity', 'Rust', 'Move', 'Python'], correct: 2 },
  { q: 'Na Sui, qual conceito facilita escalabilidade?', options: ['Estado global monolítico', 'Modelo orientado a objetos com ownership', 'Sharding rígido sempre', 'Geração de blocos lenta'], correct: 1 },
  { q: 'Qual é um caso de uso típico para Sui?', options: ['Jogos e NFTs com interação rica', 'Somente bancos tradicionais', 'Somente redes privadas', 'Hospedagem de e-mails'], correct: 0 },
]

function App() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransactionBlock()

  const [answers, setAnswers] = useState(Array(questions.length).fill(null))
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [packageId, setPackageId] = useState('')
  const [adminCapId, setAdminCapId] = useState('')
  const [status, setStatus] = useState('')

  const total = questions.length
  const canMint = useMemo(() => (score ?? 0) >= 8, [score])

  const onSelect = (qi, oi) => {
    const next = [...answers]
    next[qi] = oi
    setAnswers(next)
  }

  const compute = () => {
    let s = 0
    for (let i = 0; i < total; i++) if (answers[i] === questions[i].correct) s++
    setScore(s)
    setFeedback(
      s === total ? 'Perfeito! Você acertou todas as perguntas.' :
      s / total >= 0.8 ? 'Ótimo! Você acertou a maioria. Continue assim!' :
      s / total >= 0.5 ? 'Bom começo! Reveja os conceitos para melhorar.' :
      'Tudo bem! Aprender é um processo. Tente novamente e avance.'
    )
    setStatus('')
  }

  const reset = () => {
    setAnswers(Array(questions.length).fill(null))
    setScore(null)
    setFeedback('')
    setStatus('')
  }

  const mint = async () => {
    if (!account?.address) { setStatus('Conecte uma carteira antes de cunhar.'); return }
    if (!packageId || !adminCapId) { setStatus('Informe Package ID e AdminCap Object ID.'); return }
    try {
      setStatus('Construindo transação...')
      const tx = new Transaction()
      tx.moveCall({
        target: `${packageId}::quiz::mint_badge`,
        arguments: [tx.object(adminCapId), tx.pure.address(account.address), tx.pure.u8(score), tx.pure.u8(total)],
      })
      const res = await signAndExecute({ transactionBlock: tx, options: { showEffects: true, showEvents: true, showObjectChanges: true } })
      const digest = res?.digest || res?.effects?.transactionDigest || 'desconhecido'
      setStatus(`Badge cunhado! Tx: ${digest}`)
    } catch (e) {
      setStatus(`Erro ao cunhar: ${e?.message || e}`)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Sui Quiz</h1>
        <p className="subtitle">Aprenda o básico de finanças, blockchain e a rede Sui</p>
        <div className="wallet-bar">
          <ConnectButton connectText="Conectar carteira" />
          <span className="wallet-address">{account?.address ? `Conectado: ${account.address}` : ''}</span>
        </div>
      </header>

      <main>
        <section className="quiz">
          {questions.map((item, qi) => (
            <fieldset className="question" key={qi}>
              <legend>{qi + 1}. {item.q}</legend>
              <div className="options">
                {item.options.map((opt, oi) => (
                  <label className="option" key={oi}>
                    <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => onSelect(qi, oi)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="actions">
            <button className="btn primary" onClick={compute}>Enviar respostas</button>
            <button className="btn" onClick={reset}>Refazer</button>
          </div>
        </section>

        <section className="result">
          {score !== null && (
            <>
              <div className="score">Pontuação: {score}/{total}</div>
              <div className="feedback">{feedback}</div>
            </>
          )}
        </section>

        {canMint && (
          <section className="reward">
            <div className="badge"><span className="dot" /> Parabéns! Você ganhou o badge "Sui Savvy"</div>
            <p className="feedback">Opcional: cunhe o badge on-chain com sua carteira Sui.</p>
            <div className="question">
              <legend>Configurações on-chain</legend>
              <label className="option">
                <span>Package ID</span>
                <input value={packageId} onChange={(e) => setPackageId(e.target.value)} placeholder="0x..." />
              </label>
              <label className="option">
                <span>AdminCap Object ID</span>
                <input value={adminCapId} onChange={(e) => setAdminCapId(e.target.value)} placeholder="0x..." />
              </label>
              <div className="actions">
                <button className="btn primary" onClick={mint}>Cunhar badge on-chain</button>
              </div>
              {status && <p className="feedback" style={{ color: status.startsWith('Erro') ? 'var(--danger)' : undefined }}>{status}</p>}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <small>Feito com Move/Sui (badge opcional on-chain). Código educacional.</small>
      </footer>
    </div>
  )
}

export default App
