/**
 * Helpers para Queue/Jobs
 * Implementa enqueueJob para adicionar jobs à fila
 * 
 * NOTA: Em produção, use Redis + Bull ou similar
 * Por enquanto, implementação simples que pode ser expandida
 */

export interface Job {
  id: string
  name: string
  payload: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// Simulação de fila em memória (em produção, use Redis)
const jobQueue: Map<string, Job> = new Map()

/**
 * Adiciona job à fila
 * 
 * @param name Nome do tipo de job (ex: 'build-voice')
 * @param payload Dados do job
 * @returns Job criado
 */
export async function enqueueJob(name: string, payload: any): Promise<Job> {
  const jobId = generateJobId()
  
  const job: Job = {
    id: jobId,
    name,
    payload,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  jobQueue.set(jobId, job)
  
  
  // Em produção, aqui você faria:
  // - Adicionar ao Redis/Bull
  // - Notificar worker Python
  // - Salvar no banco de dados
  
  // Por enquanto, apenas retornar
  return job
}

/**
 * Busca job por ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  return jobQueue.get(jobId) || null
}

/**
 * Atualiza status do job
 */
export async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  result?: any
): Promise<void> {
  const job = jobQueue.get(jobId)
  if (job) {
    job.status = status
    job.updatedAt = new Date()
    if (result) {
      job.payload = { ...job.payload, result }
    }
    jobQueue.set(jobId, job)
  }
}

/**
 * Gera ID único para job
 */
function generateJobId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `job_${crypto.randomUUID()}`
  }
  // Fallback para Node.js
  const cryptoNode = require('crypto')
  return `job_${cryptoNode.randomUUID()}`
}

/**
 * NOTA: Para produção, implemente:
 * 
 * 1. Redis + Bull:
 *    import Bull from 'bull'
 *    const queue = new Bull('voice-jobs', { redis: { host: 'localhost', port: 6379 } })
 *    await queue.add(name, payload)
 * 
 * 2. Worker Python escuta a fila:
 *    from bull import Queue
 *    queue = Queue('voice-jobs', connection=redis_conn)
 *    @queue.process('build-voice')
 *    def process_build_voice(job):
 *        # Chama workers/build_voice.py
 * 
 * 3. Ou use n8n/webhooks para orquestrar
 */

