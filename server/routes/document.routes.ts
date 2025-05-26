import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { DocumentType } from '@shared/schema';
import { db } from '../utils/db';
import { DocumentModel } from '../models/document.model';

const router = Router();
const documentController = new DocumentController(new DocumentModel(db));

// Get documents
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type ? (req.query.type as string) as DocumentType : undefined;
    const documents = await documentController.getDocumentsByUserId(userId, type);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await documentController.getDocumentById(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create document
router.post('/', async (req, res) => {
  try {
    const document = await documentController.createDocument({
      userId: req.user.id,
      type: req.body.type as DocumentType,
      title: req.body.title,
      content: req.body.content,
      version: req.body.version,
    });
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update document
router.put('/:id', async (req, res) => {
  try {
    const document = await documentController.updateDocument(parseInt(req.params.id), {
      title: req.body.title,
      content: req.body.content,
      version: req.body.version,
    });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    await documentController.deleteDocument(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router; 