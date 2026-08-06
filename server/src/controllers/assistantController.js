const assistantService = require("../services/assistantService");
const { ok, fail } = require("../utils/apiResponse");

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return fail(res, "message is required", 400);

  const result = await assistantService.chat(message.trim());
  return ok(res, result);
};

exports.recommendations = async (req, res) => {
  const result = await assistantService.recommendations(req.user);
  return ok(res, result);
};

exports.compare = async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length < 2) {
    return fail(res, "productIds must be an array of at least 2 product IDs", 400);
  }
  if (productIds.length > 4) {
    return fail(res, "You can compare up to 4 products at a time", 400);
  }

  const result = await assistantService.compareProducts(productIds);
  return ok(res, result);
};

exports.similar = async (req, res) => {
  const products = await assistantService.similarProducts(req.params.productId);
  return ok(res, { products });
};

exports.productQna = async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return fail(res, "question is required", 400);

  const result = await assistantService.productQna(req.params.productId, question.trim());
  return ok(res, result);
};
