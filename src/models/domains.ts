import { STORAGE_DOMAINS } from "../constants"
import { BrowserStorage } from "../types/browser-adapters"
import { Domain } from "../types/search-refiner"

type Domains = Record<string, Domain>

export const DomainsModel = {
  async getDomains(storage: BrowserStorage): Promise<Domains> {
    const domainStorage: Record<string, unknown> = await storage.get(STORAGE_DOMAINS)
    
    return domainStorage[STORAGE_DOMAINS] as Domains || {} 
  },
  async setDomain(storage: BrowserStorage, domain: Domain): Promise<void> {
    const domains = await this.getDomains(storage)
  
    await storage.set({
      [STORAGE_DOMAINS]: {
        ...domains,
        [domain.domain]: domain
      }
    })
  },
  async addDomain (storage: BrowserStorage, domainStr: string): Promise<Domain> {
    const domains = await this.getDomains(storage)
  
    domains[domainStr] = domains[domainStr] || {
      domain: domainStr,
      blocked: false,
      note: ""
    }
  
    await this.setDomain(storage, domains[domainStr])
  
    return domains[domainStr]
  },
  async removeDomain (storage: BrowserStorage, domainStr: string): Promise<void> {
    const domains = await this.getDomains(storage)

    delete domains[domainStr]

    await storage.set({
      [STORAGE_DOMAINS]: domains
    })
  }
}