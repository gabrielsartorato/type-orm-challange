import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type must be income ou outcome');
    }

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have a enought Balance');
    }

    // verificar se existe categoria
    let checkIfCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    // criar uma categoria se não existir
    if (!checkIfCategoryExists) {
      const categoryCreate = categoryRepository.create({
        title: category,
      });

      checkIfCategoryExists = await categoryRepository.save(categoryCreate);
    }

    // criar uma transaction
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: checkIfCategoryExists.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
