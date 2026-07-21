import bcrypt from 'bcrypt'

const BCRYPT_SALT_ROUNDS = 12

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}
