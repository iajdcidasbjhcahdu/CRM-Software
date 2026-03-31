import documentService from "./document.service.js";

class DocumentController {
  async create(req, res, next) {
    try {
      const document = await documentService.createDocument(req.body, req.user.id);
      res.status(201).json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const result = await documentService.listDocuments(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const document = await documentService.getDocumentById(req.params.id);
      res.json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const document = await documentService.updateDocument(req.params.id, req.body);
      res.json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await documentService.deleteDocument(req.params.id);
      res.json({ success: true, message: "Document deleted" });
    } catch (err) {
      next(err);
    }
  }

  async getByDeal(req, res, next) {
    try {
      const documents = await documentService.getDocumentsByDeal(req.params.dealId);
      res.json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }

  async sendEmail(req, res, next) {
    try {
      const result = await documentService.sendDocumentEmail(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default new DocumentController();
