import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [proposals, setProposals] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    serviceType: '',
    value: '',
    deadline: ''
  })

  // Função para lidar com mudanças nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Função para gerar proposta (simulada)
  const generateProposal = async () => {
    if (!formData.clientName || !formData.serviceType || !formData.value || !formData.deadline) {
      alert('Por favor, preencha todos os campos!')
      return
    }

    setIsGenerating(true)
    
    // Simular delay da IA
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newProposal = {
      id: Date.now(),
      clientName: formData.clientName,
      serviceType: formData.serviceType,
      value: formData.value,
      deadline: formData.deadline,
      content: `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta para ${formData.serviceType}.

DETALHES DO PROJETO:
• Serviço: ${formData.serviceType}
• Valor do Investimento: R$ ${formData.value}
• Prazo de Entrega: ${formData.deadline}

NOSSA PROPOSTA:
Desenvolvemos soluções personalizadas que atendem às suas necessidades específicas. Nossa equipe especializada garantirá a entrega dentro do prazo estabelecido, com a qualidade que você merece.

PRÓXIMOS PASSOS:
1. Análise detalhada dos requisitos
2. Desenvolvimento da solução
3. Testes e validação
4. Entrega e suporte

Estamos à disposição para esclarecer quaisquer dúvidas.

Atenciosamente,
Equipe PitchBot`,
      createdAt: new Date().toLocaleDateString('pt-BR')
    }
    
    setProposals(prev => [newProposal, ...prev])
    setFormData({
      clientName: '',
      serviceType: '',
      value: '',
      deadline: ''
    })
    setIsGenerating(false)
  }

  // Função para deletar proposta
  const deleteProposal = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta proposta?')) {
      setProposals(prev => prev.filter(p => p.id !== id))
    }
  }

  // Função para copiar proposta
  const copyProposal = (content) => {
    navigator.clipboard.writeText(content)
    alert('Proposta copiada para a área de transferência!')
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">PB</div>
              PitchBot
            </div>
            <nav className="nav">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Home
              </a>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => setActiveTab('proposals')}
              >
                Propostas
              </a>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Configurações
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {activeTab === 'home' && (
            <div className="main-content">
              {/* Form Section */}
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
                          <label htmlFor="clientName" className="form-label">
                            Nome do Cliente
                          </label>
                          <input
                            type="text"
                            id="clientName"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Ex: João Silva"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="serviceType" className="form-label">
                            Tipo de Serviço
                          </label>
                          <input
                            type="text"
                            id="serviceType"
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Ex: Desenvolvimento de Website"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="value" className="form-label">
                            Valor (R$)
                          </label>
                          <input
                            type="number"
                            id="value"
                            name="value"
                            value={formData.value}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="5000"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="deadline" className="form-label">
                            Prazo de Entrega
                          </label>
                          <input
                            type="text"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Ex: 30 dias"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className={`btn btn-primary generate-btn ${isGenerating ? 'loading-btn' : ''}`}
                        disabled={isGenerating}
                      >
                        {isGenerating ? 'Gerando Proposta...' : '🤖 Gerar Proposta com IA'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Proposals Section */}
              <div className="proposals-section">
                <h2 className="section-title">
                  Propostas Recentes 
                  {proposals.length > 0 && (
                    <span className="proposals-count">{proposals.length}</span>
                  )}
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
                              </div>
                            </div>
                            <div className="proposal-actions">
                              <button
                                className="action-btn edit"
                                title="Editar"
                                onClick={() => alert('Funcionalidade em desenvolvimento')}
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn copy"
                                title="Copiar"
                                onClick={() => copyProposal(proposal.content)}
                              >
                                📋
                              </button>
                              <button
                                className="action-btn delete"
                                title="Deletar"
                                onClick={() => deleteProposal(proposal.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="proposal-content">
                            {proposal.content}
                          </div>
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
            <div className="text-center" style={{ padding: '4rem 0' }}>
              <h2>⚙️ Configurações</h2>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
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
