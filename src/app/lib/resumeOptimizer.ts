import { OptimizeData } from './optimizeSchemas';

export interface KeywordGap {
  missing: string[];
  weakPhrasing: string[];
  mechanicalPhrases: string[];
  densityIssues: string[];
}

export interface ValidationResult {
  hasMetaComments: boolean;
  hasMechanicalPhrases: boolean;
  structuralImprovement: number;
  keywordStuffingRisk: boolean;
  passed: boolean;
}

export interface ExactPhrase {
  phrase: string;
  priority: 'high' | 'medium' | 'low';
}

export const EXACT_PHRASES: ExactPhrase[] = [
  { phrase: "CI/CD pipelines", priority: 'high' },
  { phrase: "cloud deployment", priority: 'high' },
  { phrase: "component-driven architecture", priority: 'high' },
  { phrase: "SEO best practices", priority: 'high' },
  { phrase: "scalable frontend systems", priority: 'high' },
  { phrase: "API integration", priority: 'high' },
];

export const MECHANICAL_PHRASES = [
  "to mentor team members",
  "for comprehensive API integration", 
  "to contribute to scalable frontend systems",
  "to highlight",
  "enhanced to highlight",
  "aligned to JD:",
];

export const WEAK_VERB_PATTERNS = [
  /^Experienced in/,
  /^Responsible for/,
  /^Involved in/,
  /^Participated in/,
  /^Familiar with/,
];

export class KeywordExtractor {
  static extractFromJD(jobDescription: string): string[] {
    const text = jobDescription.toLowerCase();
    const keywords = new Set<string>();
    
    // Extract technical terms (2+ words, capitalized or with special chars)
    const techTerms = text.match(/\b([a-z]+(?:\s+[a-z]+){1,3})\b/g) || [];
    techTerms.forEach(term => {
      if (term.length >= 4 && !this.isCommonWord(term)) {
        keywords.add(term);
      }
    });
    
    // Extract exact phrases
    EXACT_PHRASES.forEach(({ phrase }) => {
      if (text.includes(phrase.toLowerCase())) {
        keywords.add(phrase);
      }
    });
    
    return Array.from(keywords);
  }
  
  private static isCommonWord(word: string): boolean {
    const common = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'we', 'are', 'is', 'you', 'will', 'should'];
    return common.includes(word.toLowerCase());
  }
}

export class GapAnalyzer {
  static analyze(resumeText: string, jobDescription: string): KeywordGap {
    const resume = resumeText.toLowerCase();
    const jdKeywords = KeywordExtractor.extractFromJD(jobDescription);
    
    const missing = jdKeywords.filter(keyword => !resume.includes(keyword.toLowerCase()));
    
    const weakPhrasing = this.findWeakPhrasing(resumeText);
    const mechanicalPhrases = this.findMechanicalPhrases(resumeText);
    const densityIssues = this.checkDensityIssues(resumeText, jdKeywords);
    
    return {
      missing,
      weakPhrasing,
      mechanicalPhrases,
      densityIssues,
    };
  }
  
  private static findWeakPhrasing(text: string): string[] {
    const lines = text.split('\n');
    const weak: string[] = [];
    
    lines.forEach(line => {
      WEAK_VERB_PATTERNS.forEach(pattern => {
        if (pattern.test(line.trim())) {
          weak.push(line.trim());
        }
      });
    });
    
    return weak;
  }
  
  private static findMechanicalPhrases(text: string): string[] {
    const mechanical: string[] = [];
    
    MECHANICAL_PHRASES.forEach(phrase => {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        mechanical.push(phrase);
      }
    });
    
    return mechanical;
  }
  
  private static checkDensityIssues(resume: string, keywords: string[]): string[] {
    const issues: string[] = [];
    const resumeLower = resume.toLowerCase();
    
    // Check for keyword stuffing (same keyword repeated > 3 times)
    const keywordCounts = new Map<string, number>();
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = resumeLower.match(regex) || [];
      keywordCounts.set(keyword, matches.length);
    });
    
    keywordCounts.forEach((count, keyword) => {
      if (count > 3) {
        issues.push(`Keyword "${keyword}" repeated ${count} times (risk of stuffing)`);
      }
    });
    
    return issues;
  }
}

export class TextOptimizer {
  static optimize(resumeText: string, jobDescription: string): string {
    const gap = GapAnalyzer.analyze(resumeText, jobDescription);
    let optimized = resumeText;
    
    // Replace weak phrasing with strong action verbs
    optimized = this.strengthenVerbs(optimized);
    
    // Remove mechanical phrases
    optimized = this.removeMechanicalPhrases(optimized);
    
    // Add missing exact phrases naturally
    optimized = this.addExactPhrases(optimized, gap.missing);
    
    // Remove meta-comments
    optimized = this.removeMetaComments(optimized);
    
    return optimized;
  }
  
  private static strengthenVerbs(text: string): string {
    let result = text;
    
    // Replace weak verb patterns
    result = result.replace(/^Experienced in/gm, 'Developed and implemented');
    result = result.replace(/^Responsible for/gm, 'Led and delivered');
    result = result.replace(/^Involved in/gm, 'Contributed to');
    result = result.replace(/^Participated in/gm, 'Collaborated on');
    result = result.replace(/^Familiar with/gm, 'Proficient in');
    
    return result;
  }
  
  private static removeMechanicalPhrases(text: string): string {
    let result = text;
    
    MECHANICAL_PHRASES.forEach(phrase => {
      const regex = new RegExp(this.escapeRegex(phrase), 'gi');
      result = result.replace(regex, '');
    });
    
    // Clean up double spaces and sentence fragments
    result = result.replace(/\s+/g, ' ').replace(/\.\s+\./g, '.').trim();
    
    return result;
  }
  
  private static addExactPhrases(text: string, missing: string[]): string {
    let result = text;
    
    missing.forEach(phrase => {
      if (!result.toLowerCase().includes(phrase.toLowerCase())) {
        // Try to add phrase naturally in existing sentences
        if (phrase.includes('CI/CD') && result.toLowerCase().includes('deployment')) {
          result = result.replace(/deployment/gi, 'CI/CD pipelines and deployment');
        } else if (phrase.includes('cloud deployment') && result.toLowerCase().includes('deploying')) {
          result = result.replace(/deploying/gi, 'cloud deployment');
        } else if (phrase.includes('component-driven architecture') && result.toLowerCase().includes('component')) {
          result = result.replace(/component/gi, 'component-driven architecture');
        } else if (phrase.includes('SEO best practices') && result.toLowerCase().includes('seo')) {
          result = result.replace(/seo/gi, 'SEO best practices');
        } else if (phrase.includes('scalable frontend systems') && result.toLowerCase().includes('scalable')) {
          result = result.replace(/scalable/gi, 'scalable frontend systems');
        } else if (phrase.includes('API integration') && result.toLowerCase().includes('api')) {
          result = result.replace(/api/gi, 'API integration');
        }
      }
    });
    
    return result;
  }
  
  private static removeMetaComments(text: string): string {
    let result = text;
    
    // Remove parenthetical meta-comments
    result = result.replace(/\([^)]*enhanced to highlight[^)]*\)/gi, '');
    result = result.replace(/\([^)]*aligned to JD[^)]*\)/gi, '');
    result = result.replace(/\([^)]*add metrics[^)]*\)/gi, '');
    
    return result.trim();
  }
  
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export class OutputValidator {
  static validate(original: string, optimized: string): ValidationResult {
    const hasMetaComments = this.hasMetaComments(optimized);
    const hasMechanicalPhrases = this.hasMechanicalPhrases(optimized);
    const structuralImprovement = this.calculateStructuralImprovement(original, optimized);
    const keywordStuffingRisk = this.checkKeywordStuffingRisk(optimized);
    
    const passed = !hasMetaComments && !hasMechanicalPhrases && 
                   structuralImprovement >= 15 && !keywordStuffingRisk;
    
    return {
      hasMetaComments,
      hasMechanicalPhrases,
      structuralImprovement,
      keywordStuffingRisk,
      passed,
    };
  }
  
  private static hasMetaComments(text: string): boolean {
    const metaPatterns = [
      /\(enhanced to highlight/,
      /\(aligned to JD/,
      /\(add metrics/,
      /\(improved to/,
    ];
    
    return metaPatterns.some(pattern => pattern.test(text));
  }
  
  private static hasMechanicalPhrases(text: string): boolean {
    return MECHANICAL_PHRASES.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );
  }
  
  private static calculateStructuralImprovement(original: string, optimized: string): number {
    const originalWords = original.split(/\s+/).length;
    const optimizedWords = optimized.split(/\s+/).length;
    
    // Calculate word-level difference
    const wordDiff = Math.abs(originalWords - optimizedWords) / originalWords * 100;
    
    // Calculate sentence structure changes
    const originalSentences = original.split(/[.!?]+/).length;
    const optimizedSentences = optimized.split(/[.!?]+/).length;
    const sentenceDiff = Math.abs(originalSentences - optimizedSentences) / originalSentences * 100;
    
    return Math.round((wordDiff + sentenceDiff) / 2);
  }
  
  private static checkKeywordStuffingRisk(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length >= 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    // Check if any keyword appears > 10% of total words or > 5 times
    const totalWords = words.length;
    for (const [word, count] of wordCounts) {
      if (count > 5 || (count / totalWords) > 0.1) {
        return true;
      }
    }
    
    return false;
  }
}

export class ATSScoreCalculator {
  static calculate(resumeText: string, jobDescription: string): number {
    const gap = GapAnalyzer.analyze(resumeText, jobDescription);
    const jdKeywords = KeywordExtractor.extractFromJD(jobDescription);
    
    const totalKeywords = jdKeywords.length;
    const matchedKeywords = totalKeywords - gap.missing.length;
    
    // Base score from keyword matching
    let score = (matchedKeywords / totalKeywords) * 100;
    
    // Bonus for exact phrase matches
    EXACT_PHRASES.forEach(({ phrase }) => {
      if (resumeText.toLowerCase().includes(phrase.toLowerCase())) {
        score += 5;
      }
    });
    
    // Penalty for mechanical phrases
    gap.mechanicalPhrases.forEach(() => {
      score -= 3;
    });
    
    // Penalty for meta-comments
    if (resumeText.match(/\(enhanced to highlight|\(aligned to JD/)) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
