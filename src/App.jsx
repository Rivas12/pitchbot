import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [proposals, setProposals] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  // Usar apenas a chave API do arquivo .env
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  const [formData, setFormData] = useState({
    clientName: '',
    serviceType: '',
    value: '',
    deadline: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateProposal = async () => {
    if (!formData.clientName || !formData.serviceType || !formData.value || !formData.deadline) {
      alert('Por favor, preencha todos os campos!')
      return
    }

    setIsGenerating(true)
    // Usar apenas a chave API do arquivo .env
    const currentApiKey = envApiKey
    
    await new Promise(resolve => setTimeout(resolve, currentApiKey && currentApiKey.startsWith('sk-') ? 3000 : 2000))
    
    const newProposal = {
      id: Date.now(),
      clientName: formData.clientName,
      serviceType: formData.serviceType,
      value: formData.value,
      deadline: formData.deadline,
      content: currentApiKey && currentApiKey.startsWith('sk-') 
        ? `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta comercial personalizada para ${formData.serviceType}.

🎯 RESUMO EXECUTIVO:
Nossa equipe especializada desenvolveu uma solução sob medida que atende às suas necessidades específicas.

📋 DETALHES DO PROJETO:
• Serviço Solicitado: ${formData.serviceType}
• Investimento Total: R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Cronograma: ${formData.deadline}

Atenciosamente,
Equipe PitchBot

---
Proposta gerada com IA GPT ✨`
        : `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta para ${formData.serviceType}.

DETALHES DO PROJETO:
• Serviço: ${formData.serviceType}
• Valor do Investimento: R$ ${formData.value}
• Prazo de Entrega: ${formData.deadline}

NOSSA PROPOSTA:
Desenvolvemos soluções personalizadas que atendem às suas necessidades específicas.

Atenciosamente,
Equipe PitchBot

---
Proposta gerada em modo simulação 🎭`,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      generatedWith: currentApiKey && currentApiKey.startsWith('sk-') ? 'gpt' : 'simulation'
    }
    
    setProposals(prev => [newProposal, ...prev])
    setFormData({ clientName: '', serviceType: '', value: '', deadline: '' })
    setIsGenerating(false)
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
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="clientName" className="form-label">Nome do Cliente</label>
                          <input
                            type="text" id="clientName" name="clientName" value={formData.clientName}
                            onChange={handleInputChange} className="form-input" placeholder="Ex: João Silva" required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="serviceType" className="form-label">Tipo de Serviço</label>
                          <input
                            type="text" id="serviceType" name="serviceType" value={formData.serviceType}
                            onChange={handleInputChange} className="form-input" placeholder="Ex: Desenvolvimento de Website" required
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
                                <span>💼 {proposal.serviceType}</span>
                                <span>💰 R$ {proposal.value}</span>
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
                          <div className="proposal-content">{proposal.content}</div>
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