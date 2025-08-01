export interface AgentExecutionResponse {
  executionId: string;
}

export interface AgentStatusResponse {
  status: string;
  execution: {
    _id: string;
    status: 'queued' | 'running' | 'finished' | 'failed';
    outputs?: {
      mermaid: string;
    };
  };
}

export class AgentService {
  private static readonly API_BASE_URL = 'https://beta-cloud.integrail.ai/api';
  private static readonly ACCOUNT_ID = import.meta.env.VITE_INTEGRAIL_ACCOUNT_ID;
  private static readonly AGENT_ID = import.meta.env.VITE_INTEGRAIL_AGENT_ID;
  
  static async executeAgent(ytUrl: string): Promise<string> {
    const bearerToken = import.meta.env.VITE_INTEGRAIL_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('Bearer token not configured');
    }
    
    if (!this.ACCOUNT_ID || !this.AGENT_ID) {
      throw new Error('Account ID or Agent ID not configured');
    }

    try {
      console.log('Executing agent with YouTube URL:', ytUrl);
      
      const response = await fetch(`${this.API_BASE_URL}/${this.ACCOUNT_ID}/agent/${this.AGENT_ID}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            ytUrl
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agent execution failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to execute agent: ${response.status} ${response.statusText}`);
      }

      const result: AgentExecutionResponse = await response.json();
      console.log('Agent execution started:', result.executionId);
      return result.executionId;
    } catch (error) {
      console.error('Error executing agent:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to connect to the AI agent service. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  static async getExecutionStatus(executionId: string): Promise<AgentStatusResponse> {
    const bearerToken = import.meta.env.VITE_INTEGRAIL_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('Bearer token not configured');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/${this.ACCOUNT_ID}/agent/${executionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status check failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to get execution status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting execution status:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to check AI agent status. Please try again.');
      }
      throw error;
    }
  }

  static async pollExecutionUntilComplete(executionId: string, maxAttempts: number = 300): Promise<string> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await this.getExecutionStatus(executionId);
      console.log(`Attempt ${attempts + 1}: Status = ${statusResponse.execution.status}`);
      
      if (statusResponse.execution.status === 'finished') {
        if (statusResponse.execution.outputs?.mermaid) {
          return statusResponse.execution.outputs.mermaid;
        } else {
          throw new Error('No mermaid diagram received from AI agent');
        }
      } else if (statusResponse.execution.status === 'failed') {
        throw new Error('AI agent execution failed');
      }
      
      attempts++;
    }
    
    throw new Error('AI agent processing timeout - please try again');
  }

  static async processYouTubeUrl(ytUrl: string): Promise<string> {
    try {
      // Step 1: Execute the agent
      const executionId = await this.executeAgent(ytUrl);
      
      // Step 2: Poll until completion and get the mermaid diagram
      const mermaidDiagram = await this.pollExecutionUntilComplete(executionId);
      
      return mermaidDiagram;
    } catch (error) {
      console.error('Error processing YouTube URL:', error);
      throw error;
    }
  }
}