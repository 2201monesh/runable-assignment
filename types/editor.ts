export interface DOMTreeNode {
  tag: string
  depth: number
  xpath: string
  text: string
}

export interface SelectedElement {
  tag: string
  text: string
  isTextElement: boolean
  styles: {
    fontSize: string
    fontWeight: string
    color: string
    backgroundColor: string
    padding: string
    borderRadius: string
    textAlign: string
    width: string
    borderWidth: string
    borderColor: string
  }
  xpath: string
}
