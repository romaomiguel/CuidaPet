/** Valida CPF com os dois dígitos verificadores */
export function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return false
  if (/^(\d)\1{10}$/.test(nums)) return false // todos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(nums[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === parseInt(nums[10])
}

/** Aplica máscara 000.000.000-00 conforme o usuário digita */
export function maskCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}
