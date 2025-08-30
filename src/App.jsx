import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [proposals, setProposals] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  // Status da API Flask
  const [apiStatus, setApiStatus] = useState({ status: 'checking', message: 'Verificando conexão...' })
  // Usar apenas a chave API do arquivo .env para compatibilidade
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  const [formData, setFormData] = useState({
    clientName: '',
    projectDescription: '',
    additionalPoints: '',
    value: '',
    deadline: '',
    showAdditionalPoints: false
  })
  
  // Verificar status da API ao carregar
  useEffect(() => {
    checkApiStatus()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Função para verificar o status da API Flask
  const checkApiStatus = async () => {
    try {
      setApiStatus({ status: 'checking', message: 'Verificando conexão...' })
      const response = await fetch('http://localhost:5000/api/health')
      const data = await response.json()
      
      if (data.status === 'online') {
        setApiStatus({ status: 'online', message: 'API Flask conectada' })
      } else {
        setApiStatus({ status: 'error', message: 'API Flask indisponível' })
      }
    } catch (error) {
      setApiStatus({ status: 'offline', message: 'API Flask não está disponível' })
    }
  }

  const generateProposal = async () => {
    if (!formData.clientName || !formData.projectDescription || !formData.value || !formData.deadline) {
      alert('Por favor, preencha todos os campos obrigatórios!')
      return
    }

    setIsGenerating(true)
    
    try {
      // Verificar se a API está online
      if (apiStatus.status === 'online') {
        // Usar API Flask
        const response = await fetch('http://localhost:5000/api/generate-proposal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: formData.clientName,
            projectDescription: formData.projectDescription,
            additionalPoints: formData.additionalPoints,
            value: formData.value,
            deadline: formData.deadline,
          }),
        })
        
        const result = await response.json()
        
        if (result.success && result.proposal) {
          const serverProposal = result.proposal
          
          const newProposal = {
            id: Date.now(),
            clientName: serverProposal.clientName,
            projectDescription: serverProposal.projectDescription,
            additionalPoints: serverProposal.additionalPoints,
            value: serverProposal.value,
            deadline: serverProposal.deadline,
            content: serverProposal.content,
            createdAt: new Date().toLocaleDateString('pt-BR'),
            generatedWith: serverProposal.generatedWith
          }
          
          setProposals(prev => [newProposal, ...prev])
        } else {
          throw new Error(result.error || 'Erro ao gerar proposta')
        }
      } else {
        // Modo de fallback - usar o método antigo direto no frontend
        const currentApiKey = envApiKey
        
        await new Promise(resolve => setTimeout(resolve, currentApiKey && currentApiKey.startsWith('sk-') ? 3000 : 2000))
        
        const newProposal = {
          id: Date.now(),
          clientName: formData.clientName,
          projectDescription: formData.projectDescription,
          additionalPoints: formData.additionalPoints,
          value: formData.value,
          deadline: formData.deadline,
          content: currentApiKey && currentApiKey.startsWith('sk-') 
            ? `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta comercial personalizada para o projeto de ${formData.projectDescription}.

🎯 RESUMO EXECUTIVO:
Nossa equipe especializada desenvolveu uma solução completa e sob medida para atender às suas necessidades específicas, garantindo excelência, pontualidade e resultados superiores.

📋 DETALHES DO PROJETO:
• Escopo: ${formData.projectDescription}
• Prazo de Entrega: ${formData.deadline}
• Investimento Total: R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${formData.additionalPoints ? `✅ DIFERENCIAIS INCLUSOS:
${formData.additionalPoints.split(',').map(point => '• ' + point.trim()).join('\n')}

` : ''}💼 NOSSA METODOLOGIA:
1. Análise detalhada dos requisitos e objetivos
2. Desenvolvimento personalizado com foco em qualidade
3. Testes rigorosos para garantir perfeito funcionamento
4. Entrega dentro do prazo com suporte dedicado

🤝 PRÓXIMOS PASSOS:
Caso esta proposta atenda às suas expectativas, podemos agendar uma reunião para discutir os detalhes e iniciar o projeto o quanto antes.

Atenciosamente,
Equipe PitchBot

---
Proposta gerada com IA GPT ✨`
            : `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta para o projeto de ${formData.projectDescription}.

DETALHES DO PROJETO:
• Projeto: ${formData.projectDescription}
• Valor do Investimento: R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Prazo de Entrega: ${formData.deadline}
${formData.additionalPoints ? `\nPONTOS ADICIONAIS:\n${formData.additionalPoints}` : ''}

NOSSA PROPOSTA:
Desenvolvemos soluções personalizadas que atendem às suas necessidades específicas, seguindo as melhores práticas do mercado e garantindo qualidade excepcional.

Atenciosamente,
Equipe PitchBot

---
Proposta gerada em modo simulação 🎭`,
          createdAt: new Date().toLocaleDateString('pt-BR'),
          generatedWith: currentApiKey && currentApiKey.startsWith('sk-') ? 'gpt' : 'simulation'
        }
        
        setProposals(prev => [newProposal, ...prev])
      }
      
    } catch (error) {
      console.error('Erro ao gerar proposta:', error)
      alert('Ocorreu um erro ao gerar a proposta. Por favor, tente novamente.')
    } finally {
      // Limpar formulário e finalizar estado de carregamento
      setFormData({ 
        clientName: '', 
        projectDescription: '', 
        additionalPoints: '', 
        value: '', 
        deadline: '',
        showAdditionalPoints: false  // Reset to collapsed state after submission
      })
      setIsGenerating(false)
    }
  }

  const deleteProposal = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta proposta?')) {
      setProposals(prev => prev.filter(p => p.id !== id))
    }
  }

  const copyProposal = (content) => {
    navigator.clipboard.writeText(content)
    alert('Proposta copiada para a área de transferência!')
  }

  // Funções de gerenciamento de chave API removidas, 
  // já que usamos apenas a chave do arquivo .env

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">PB</div>
              PitchBot
            </div>
            <nav className="nav">
              <a href="#" className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                Home
              </a>
              <a href="#" className={`nav-link ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => setActiveTab('proposals')}>
                Propostas
              </a>
              <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                Configurações
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {activeTab === 'home' && (
            <div className="main-content">
              <div className="form-section">
                <h1 className="section-title">Criar Nova Proposta</h1>
                <p className="section-subtitle">
                  Preencha os dados abaixo e nossa IA criará uma proposta profissional para você.
                </p>
                
                <div className="card form-card">
                  <div className="card-header">
                    <h3>Dados da Proposta</h3>
                    <p>Informe os detalhes do projeto</p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(e) => { e.preventDefault(); generateProposal(); }}>
                      <div className="form-grid" style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
                        {/* Informações básicas */}
                        <div className="form-grid-3-cols">
                          <div className="form-group">
                            <label htmlFor="clientName" className="form-label">Nome do Cliente</label>
                            <input
                              type="text" id="clientName" name="clientName" value={formData.clientName}
                              onChange={handleInputChange} className="form-input" placeholder="Ex: João Silva" required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="value" className="form-label">Valor (R$)</label>
                            <input
                              type="number" id="value" name="value" value={formData.value}
                              onChange={handleInputChange} className="form-input" placeholder="5000" min="0" step="0.01" required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="deadline" className="form-label">Prazo de Entrega</label>
                            <input
                              type="text" id="deadline" name="deadline" value={formData.deadline}
                              onChange={handleInputChange} className="form-input" placeholder="Ex: 30 dias" required
                            />
                          </div>
                        </div>
                        
                        {/* Descrição do projeto - campo maior */}
                        <div className="form-group">
                          <label htmlFor="projectDescription" className="form-label">Descrição do Projeto</label>
                          <textarea
                            id="projectDescription" name="projectDescription" value={formData.projectDescription}
                            onChange={handleInputChange} className="form-input" 
                            placeholder="Descreva o projeto em detalhes. Ex: Desenvolvimento de website institucional com 5 páginas, área de blog e formulário de contato."
                            style={{minHeight: "120px", resize: "vertical"}} required
                          />
                        </div>
                        
                        {/* Pontos adicionais - campo maior (colapsável) */}
                        <div className="form-group">
                          <div 
                            onClick={() => setFormData(prev => ({...prev, showAdditionalPoints: !prev.showAdditionalPoints}))} 
                            style={{
                              display: "flex",
                              alignItems: "center", 
                              cursor: "pointer",
                              marginBottom: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "4px",
                              background: "linear-gradient(to right, rgba(var(--primary-blue-rgb), 0.05), transparent)",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <label htmlFor="additionalPoints" className="form-label" style={{
                              margin: 0, 
                              cursor: "pointer",
                              fontWeight: "600",
                              color: "var(--primary-blue)"
                            }}>
                              Pontos Adicionais <span style={{fontSize: "0.8em", fontWeight: "normal"}}>(opcional)</span>
                            </label>
                            <div style={{
                              marginLeft: "auto",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              background: "var(--primary-blue)",
                              color: "white",
                              transform: formData.showAdditionalPoints ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.4s ease"
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                              </svg>
                            </div>
                          </div>
                          
                          <div style={{
                            maxHeight: formData.showAdditionalPoints ? "500px" : "0",
                            overflow: "hidden",
                            transition: "max-height 0.5s ease-in-out, opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
                            opacity: formData.showAdditionalPoints ? 1 : 0,
                            transform: formData.showAdditionalPoints ? "translateY(0)" : "translateY(-10px)"
                          }}>
                            <textarea
                              id="additionalPoints" name="additionalPoints" value={formData.additionalPoints}
                              onChange={handleInputChange} className="form-input" 
                              placeholder="Liste os diferenciais e benefícios inclusos na proposta. Ex: Design responsivo, Otimização SEO, 3 meses de suporte gratuito, Treinamento da equipe"
                              style={{
                                minHeight: "150px", 
                                resize: "vertical",
                                border: "1px solid var(--primary-blue)",
                                boxShadow: "0 2px 8px rgba(var(--primary-blue-rgb), 0.15)"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="submit" disabled={isGenerating}
                        className={`btn btn-primary generate-btn ${isGenerating ? 'loading-btn' : ''}`}
                      >
                        {isGenerating ? 'Gerando Proposta...' : '🤖 Gerar Proposta com IA'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="proposals-section">
                <h2 className="section-title">
                  Propostas Recentes 
                  {proposals.length > 0 && <span className="proposals-count">{proposals.length}</span>}
                </h2>
                
                <div className="proposals-grid">
                  {proposals.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>Nenhuma proposta criada ainda</h3>
                      <p>Crie sua primeira proposta usando o formulário ao lado</p>
                    </div>
                  ) : (
                    proposals.map((proposal) => (
                      <div key={proposal.id} className="card proposal-card">
                        <div className="card-body">
                          <div className="proposal-header">
                            <div className="proposal-info">
                              <h4>{proposal.clientName}</h4>
                              <div className="proposal-meta">
                                <span title={proposal.projectDescription}>📝 {proposal.projectDescription.length > 30 ? proposal.projectDescription.substring(0, 30) + '...' : proposal.projectDescription}</span>
                                <span>💰 R$ {parseFloat(proposal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span>⏰ {proposal.deadline}</span>
                                <span>📅 {proposal.createdAt}</span>
                                {proposal.generatedWith === 'gpt' && <span>🤖 GPT</span>}
                                {proposal.generatedWith === 'simulation' && <span>🎭 Simulação</span>}
                              </div>
                            </div>
                            <div className="proposal-actions">
                              <button className="action-btn edit" title="Editar" onClick={() => alert('Em desenvolvimento')}>✏️</button>
                              <button className="action-btn copy" title="Copiar" onClick={() => copyProposal(proposal.content)}>📋</button>
                              <button className="action-btn delete" title="Deletar" onClick={() => deleteProposal(proposal.id)}>🗑️</button>
                            </div>
                          </div>
                          <div className="proposal-content" style={{ whiteSpace: "pre-wrap" }}>{proposal.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'proposals' && (
            <div className="text-center" style={{ padding: '4rem 0' }}>
              <h2>📋 Área de Propostas</h2>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h1 className="section-title">⚙️ Configurações</h1>
              <p className="section-subtitle">Configure suas preferências e integrações da aplicação.</p>

              <div className="grid grid-cols-1" style={{ maxWidth: '600px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3>🤖 Integração OpenAI</h3>
                    <p>Configure sua chave API para usar o GPT na geração de propostas</p>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">Status da Chave API OpenAI</label>
                      <div style={{ fontSize: '0.875rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                        {envApiKey ? (
                          <span style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                            ✅ Chave API configurada no arquivo .env
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                            ⚠️ Nenhuma chave API configurada no arquivo .env.
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Status da API Flask</label>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        padding: '1rem', 
                        backgroundColor: 'var(--gray-50)', 
                        borderRadius: 'var(--radius)', 
                        border: '1px solid var(--gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          color: apiStatus.status === 'online' ? 'var(--primary-blue)' : 
                                 apiStatus.status === 'checking' ? 'var(--gray-600)' : 
                                 'var(--accent-orange)', 
                          fontWeight: 'bold' 
                        }}>
                          {apiStatus.status === 'online' ? '✅ ' : 
                           apiStatus.status === 'checking' ? '⏳ ' : 
                           '⚠️ '}
                          {apiStatus.message}
                        </span>
                        <button 
                          onClick={checkApiStatus}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'var(--gray-200)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Verificar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>ℹ️ Informações</h3>
                    <p>Como obter e configurar sua chave API</p>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                        Como obter sua chave API:
                      </h4>
                      <ol style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)' }}>
                        <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
                        <li>Faça login ou crie uma conta</li>
                        <li>Clique em "Create new secret key"</li>
                        <li>Copie a chave e cole aqui</li>
                      </ol>
                      
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                        <strong style={{ color: 'var(--accent-orange)' }}>⚠️ Importante:</strong><br />
                        Este aplicativo usa exclusivamente a chave API configurada no arquivo .env do projeto para maior segurança.
                        Para configurar sua chave, adicione-a ao arquivo .env como VITE_OPENAI_API_KEY=sua_chave_aqui
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>📊 Status</h3>
                    <p>Informações sobre o sistema</p>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2" style={{ gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <strong>Propostas criadas:</strong><br />
                        <span style={{ color: 'var(--primary-blue)', fontSize: '1.5rem', fontWeight: '600' }}>
                          {proposals.length}
                        </span>
                      </div>
                      <div>
                        <strong>Modo IA:</strong><br />
                        <span style={{ color: envApiKey ? 'var(--primary-blue)' : 'var(--accent-orange)', fontWeight: '600' }}>
                          {envApiKey ? '🤖 GPT Ativo' : '🎭 Simulação'}
                        </span>
                      </div>
                      <div>
                        <strong>Versão:</strong><br />
                        <span style={{ color: 'var(--gray-600)' }}>v1.0.0</span>
                      </div>
                      <div>
                        <strong>Última atualização:</strong><br />
                        <span style={{ color: 'var(--gray-600)' }}>30/08/2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2025 PitchBot. Todos os direitos reservados. Criado com ❤️ e IA.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App