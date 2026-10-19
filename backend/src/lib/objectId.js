import mongoose from 'mongoose'

export function isObjectId(value) {
  return mongoose.isValidObjectId(value)
}
