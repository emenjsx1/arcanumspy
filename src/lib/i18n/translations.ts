// Traduções para múltiplos idiomas
export type Locale = 'pt-BR' | 'pt-MZ' | 'en-US' | 'es-ES' | 'fr-FR'

export interface Translations {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    save: string
    delete: string
    edit: string
    back: string
    next: string
    previous: string
    search: string
    filter: string
    close: string
    open: string
  }
  pricing: {
    title: string
    subtitle: string
    monthly: string
    yearly: string
    perMonth: string
    perYear: string
    save: string
    popular: string
    startNow: string
    changePlan: string
    choosePlan: string
    faq: string
    canChangePlan: string
    canChangePlanAnswer: string
    annualDiscount: string
    annualDiscountAnswer: string
    medicalPlans: string
    medicalPlansAnswer: string
  }
  credits: {
    title: string
    balance: string
    totalLoaded: string
    totalConsumed: string
    purchase: string
    purchaseCredits: string
    customAmount: string
    transactions: string
    transactionHistory: string
    noTransactions: string
    category: string
    description: string
    date: string
    amount: string
    balanceAfter: string
    purchasing: string
    purchaseError: string
    purchaseSuccess: string
    lowBalance: string
    blocked: string
  }
  dashboard: {
    welcome: string
    overview: string
    statistics: string
  }
  auth: {
    login: string
    signup: string
    logout: string
    email: string
    password: string
    forgotPassword: string
    resetPassword: string
    createAccount: string
    alreadyHaveAccount: string
  }
  navigation: {
    home: string
    pricing: string
    about: string
    contact: string
    dashboard: string
    library: string
    favorites: string
    account: string
    settings: string
  }
}

const translations: Record<Locale, Translations> = {
  'pt-BR': {
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      close: 'Fechar',
      open: 'Abrir',
    },
    pricing: {
      title: 'Planos para Profissionais da Saúde 🩺',
      subtitle: 'Escolha o plano certo para sua clínica ou agência',
      monthly: 'Mensal',
      yearly: 'Anual',
      perMonth: '/mês',
      perYear: '/ano',
      save: 'economize',
      popular: 'Mais Popular',
      startNow: 'Começar agora',
      changePlan: 'Trocar Plano',
      choosePlan: 'Escolha o plano que melhor se adapta às suas necessidades',
      faq: 'Perguntas sobre Preços',
      canChangePlan: 'Posso mudar de plano depois?',
      canChangePlanAnswer: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas imediatamente.',
      annualDiscount: 'Há desconto para pagamento anual?',
      annualDiscountAnswer: 'Sim! Ao pagar anualmente, você economiza significativamente comparado ao pagamento mensal.',
      medicalPlans: 'Os planos são específicos para área médica?',
      medicalPlansAnswer: 'Sim! Todos os planos incluem acesso prioritário a ofertas da categoria Medical, além de outras categorias relevantes para profissionais da saúde.',
    },
    credits: {
      title: 'Créditos',
      balance: 'Saldo',
      totalLoaded: 'Total Carregado',
      totalConsumed: 'Total Consumido',
      purchase: 'Comprar',
      purchaseCredits: 'Comprar Créditos',
      customAmount: 'Valor Personalizado',
      transactions: 'Transações',
      transactionHistory: 'Histórico de Transações',
      noTransactions: 'Nenhuma transação encontrada',
      category: 'Categoria',
      description: 'Descrição',
      date: 'Data',
      amount: 'Valor',
      balanceAfter: 'Saldo Após',
      purchasing: 'Processando compra...',
      purchaseError: 'Erro ao comprar',
      purchaseSuccess: 'Créditos comprados com sucesso!',
      lowBalance: 'Saldo baixo',
      blocked: 'Conta bloqueada',
    },
    dashboard: {
      welcome: 'Bem-vindo',
      overview: 'Visão Geral',
      statistics: 'Estatísticas',
    },
    auth: {
      login: 'Entrar',
      signup: 'Cadastrar',
      logout: 'Sair',
      email: 'E-mail',
      password: 'Senha',
      forgotPassword: 'Esqueceu a senha?',
      resetPassword: 'Redefinir Senha',
      createAccount: 'Criar Conta',
      alreadyHaveAccount: 'Já tem uma conta?',
    },
    navigation: {
      home: 'Início',
      pricing: 'Preços',
      about: 'Sobre',
      contact: 'Contato',
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      favorites: 'Favoritos',
      account: 'Conta',
      settings: 'Configurações',
    },
  },
  'pt-MZ': {
    common: {
      loading: 'A carregar...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      search: 'Pesquisar',
      filter: 'Filtrar',
      close: 'Fechar',
      open: 'Abrir',
    },
    pricing: {
      title: 'Planos para Profissionais de Saúde 🩺',
      subtitle: 'Escolha o plano certo para a sua clínica ou agência',
      monthly: 'Mensal',
      yearly: 'Anual',
      perMonth: '/mês',
      perYear: '/ano',
      save: 'poupe',
      popular: 'Mais Popular',
      startNow: 'Começar agora',
      changePlan: 'Mudar Plano',
      choosePlan: 'Escolha o plano que melhor se adapta às suas necessidades',
      faq: 'Perguntas sobre Preços',
      canChangePlan: 'Posso mudar de plano depois?',
      canChangePlanAnswer: 'Sim! Pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas imediatamente.',
      annualDiscount: 'Há desconto para pagamento anual?',
      annualDiscountAnswer: 'Sim! Ao pagar anualmente, poupa significativamente comparado ao pagamento mensal.',
      medicalPlans: 'Os planos são específicos para área médica?',
      medicalPlansAnswer: 'Sim! Todos os planos incluem acesso prioritário a ofertas da categoria Medical, além de outras categorias relevantes para profissionais de saúde.',
    },
    credits: {
      title: 'Créditos',
      balance: 'Saldo',
      totalLoaded: 'Total Carregado',
      totalConsumed: 'Total Consumido',
      purchase: 'Comprar',
      purchaseCredits: 'Comprar Créditos',
      customAmount: 'Valor Personalizado',
      transactions: 'Transações',
      transactionHistory: 'Histórico de Transações',
      noTransactions: 'Nenhuma transação encontrada',
      category: 'Categoria',
      description: 'Descrição',
      date: 'Data',
      amount: 'Valor',
      balanceAfter: 'Saldo Após',
      purchasing: 'A processar compra...',
      purchaseError: 'Erro ao comprar',
      purchaseSuccess: 'Créditos comprados com sucesso!',
      lowBalance: 'Saldo baixo',
      blocked: 'Conta bloqueada',
    },
    dashboard: {
      welcome: 'Bem-vindo',
      overview: 'Visão Geral',
      statistics: 'Estatísticas',
    },
    auth: {
      login: 'Entrar',
      signup: 'Registar',
      logout: 'Sair',
      email: 'E-mail',
      password: 'Palavra-passe',
      forgotPassword: 'Esqueceu a palavra-passe?',
      resetPassword: 'Redefinir Palavra-passe',
      createAccount: 'Criar Conta',
      alreadyHaveAccount: 'Já tem uma conta?',
    },
    navigation: {
      home: 'Início',
      pricing: 'Preços',
      about: 'Sobre',
      contact: 'Contacto',
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      favorites: 'Favoritos',
      account: 'Conta',
      settings: 'Configurações',
    },
  },
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      close: 'Close',
      open: 'Open',
    },
    pricing: {
      title: 'Plans for Healthcare Professionals 🩺',
      subtitle: 'Choose the right plan for your clinic or agency',
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/month',
      perYear: '/year',
      save: 'save',
      popular: 'Most Popular',
      startNow: 'Start now',
      changePlan: 'Change Plan',
      choosePlan: 'Choose the plan that best fits your needs',
      faq: 'Pricing Questions',
      canChangePlan: 'Can I change plans later?',
      canChangePlanAnswer: 'Yes! You can upgrade or downgrade at any time. Changes are applied immediately.',
      annualDiscount: 'Is there a discount for annual payment?',
      annualDiscountAnswer: 'Yes! By paying annually, you save significantly compared to monthly payment.',
      medicalPlans: 'Are the plans specific to the medical field?',
      medicalPlansAnswer: 'Yes! All plans include priority access to Medical category offers, as well as other categories relevant to healthcare professionals.',
    },
    credits: {
      title: 'Credits',
      balance: 'Balance',
      totalLoaded: 'Total Loaded',
      totalConsumed: 'Total Consumed',
      purchase: 'Purchase',
      purchaseCredits: 'Purchase Credits',
      customAmount: 'Custom Amount',
      transactions: 'Transactions',
      transactionHistory: 'Transaction History',
      noTransactions: 'No transactions found',
      category: 'Category',
      description: 'Description',
      date: 'Date',
      amount: 'Amount',
      balanceAfter: 'Balance After',
      purchasing: 'Processing purchase...',
      purchaseError: 'Purchase error',
      purchaseSuccess: 'Credits purchased successfully!',
      lowBalance: 'Low balance',
      blocked: 'Account blocked',
    },
    dashboard: {
      welcome: 'Welcome',
      overview: 'Overview',
      statistics: 'Statistics',
    },
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
    },
    navigation: {
      home: 'Home',
      pricing: 'Pricing',
      about: 'About',
      contact: 'Contact',
      dashboard: 'Dashboard',
      library: 'Library',
      favorites: 'Favorites',
      account: 'Account',
      settings: 'Settings',
    },
  },
  'es-ES': {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      close: 'Cerrar',
      open: 'Abrir',
    },
    pricing: {
      title: 'Planes para Profesionales de la Salud 🩺',
      subtitle: 'Elige el plan adecuado para tu clínica o agencia',
      monthly: 'Mensual',
      yearly: 'Anual',
      perMonth: '/mes',
      perYear: '/año',
      save: 'ahorra',
      popular: 'Más Popular',
      startNow: 'Comenzar ahora',
      changePlan: 'Cambiar Plan',
      choosePlan: 'Elige el plan que mejor se adapte a tus necesidades',
      faq: 'Preguntas sobre Precios',
      canChangePlan: '¿Puedo cambiar de plan después?',
      canChangePlanAnswer: '¡Sí! Puedes hacer upgrade o downgrade en cualquier momento. Los cambios se aplican inmediatamente.',
      annualDiscount: '¿Hay descuento por pago anual?',
      annualDiscountAnswer: '¡Sí! Al pagar anualmente, ahorras significativamente en comparación con el pago mensual.',
      medicalPlans: '¿Los planes son específicos para el área médica?',
      medicalPlansAnswer: '¡Sí! Todos los planes incluyen acceso prioritario a ofertas de la categoría Medical, además de otras categorías relevantes para profesionales de la salud.',
    },
    credits: {
      title: 'Créditos',
      balance: 'Saldo',
      totalLoaded: 'Total Cargado',
      totalConsumed: 'Total Consumido',
      purchase: 'Comprar',
      purchaseCredits: 'Comprar Créditos',
      customAmount: 'Cantidad Personalizada',
      transactions: 'Transacciones',
      transactionHistory: 'Historial de Transacciones',
      noTransactions: 'No se encontraron transacciones',
      category: 'Categoría',
      description: 'Descripción',
      date: 'Fecha',
      amount: 'Cantidad',
      balanceAfter: 'Saldo Después',
      purchasing: 'Procesando compra...',
      purchaseError: 'Error al comprar',
      purchaseSuccess: '¡Créditos comprados con éxito!',
      lowBalance: 'Saldo bajo',
      blocked: 'Cuenta bloqueada',
    },
    dashboard: {
      welcome: 'Bienvenido',
      overview: 'Resumen',
      statistics: 'Estadísticas',
    },
    auth: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      logout: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste la contraseña?',
      resetPassword: 'Restablecer Contraseña',
      createAccount: 'Crear Cuenta',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
    },
    navigation: {
      home: 'Inicio',
      pricing: 'Precios',
      about: 'Acerca de',
      contact: 'Contacto',
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      favorites: 'Favoritos',
      account: 'Cuenta',
      settings: 'Configuración',
    },
  },
  'fr-FR': {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      search: 'Rechercher',
      filter: 'Filtrer',
      close: 'Fermer',
      open: 'Ouvrir',
    },
    pricing: {
      title: 'Plans pour les Professionnels de la Santé 🩺',
      subtitle: 'Choisissez le plan adapté à votre clinique ou agence',
      monthly: 'Mensuel',
      yearly: 'Annuel',
      perMonth: '/mois',
      perYear: '/an',
      save: 'économisez',
      popular: 'Le Plus Populaire',
      startNow: 'Commencer maintenant',
      changePlan: 'Changer de Plan',
      choosePlan: 'Choisissez le plan qui correspond le mieux à vos besoins',
      faq: 'Questions sur les Prix',
      canChangePlan: 'Puis-je changer de plan plus tard?',
      canChangePlanAnswer: 'Oui! Vous pouvez faire un upgrade ou downgrade à tout moment. Les changements sont appliqués immédiatement.',
      annualDiscount: 'Y a-t-il une réduction pour le paiement annuel?',
      annualDiscountAnswer: 'Oui! En payant annuellement, vous économisez considérablement par rapport au paiement mensuel.',
      medicalPlans: 'Les plans sont-ils spécifiques au domaine médical?',
      medicalPlansAnswer: 'Oui! Tous les plans incluent un accès prioritaire aux offres de la catégorie Medical, ainsi qu\'à d\'autres catégories pertinentes pour les professionnels de la santé.',
    },
    credits: {
      title: 'Crédits',
      balance: 'Solde',
      totalLoaded: 'Total Chargé',
      totalConsumed: 'Total Consommé',
      purchase: 'Acheter',
      purchaseCredits: 'Acheter des Crédits',
      customAmount: 'Montant Personnalisé',
      transactions: 'Transactions',
      transactionHistory: 'Historique des Transactions',
      noTransactions: 'Aucune transaction trouvée',
      category: 'Catégorie',
      description: 'Description',
      date: 'Date',
      amount: 'Montant',
      balanceAfter: 'Solde Après',
      purchasing: 'Traitement de l\'achat...',
      purchaseError: 'Erreur d\'achat',
      purchaseSuccess: 'Crédits achetés avec succès!',
      lowBalance: 'Solde faible',
      blocked: 'Compte bloqué',
    },
    dashboard: {
      welcome: 'Bienvenue',
      overview: 'Vue d\'ensemble',
      statistics: 'Statistiques',
    },
    auth: {
      login: 'Connexion',
      signup: 'S\'inscrire',
      logout: 'Déconnexion',
      email: 'E-mail',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      resetPassword: 'Réinitialiser le Mot de passe',
      createAccount: 'Créer un Compte',
      alreadyHaveAccount: 'Vous avez déjà un compte?',
    },
    navigation: {
      home: 'Accueil',
      pricing: 'Tarifs',
      about: 'À propos',
      contact: 'Contact',
      dashboard: 'Tableau de bord',
      library: 'Bibliothèque',
      favorites: 'Favoris',
      account: 'Compte',
      settings: 'Paramètres',
    },
  },
}

export default translations



