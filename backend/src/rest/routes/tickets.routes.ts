import { Router, type Request, type Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { TicketIssuanceModel } from '../../models/ticket-issuance.model';
import qrcode from 'qrcode';

export const ticketRouter: Router = Router();

ticketRouter.get('/:issuanceId/qr', authenticate as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const issuanceId = req.params.issuanceId;
    const userId = req.user?.id || (req.user as any)?.userId;

    if (!userId) {
       res.status(401).json({ error: 'Unauthenticated' });
       return;
    }

    const issuance = await TicketIssuanceModel.findById(issuanceId).select('+qrToken');
    if (!issuance) {
       res.status(404).json({ error: 'Ticket not found' });
       return;
    }

    if (issuance.userId.toString() !== userId.toString()) {
       res.status(403).json({ error: 'Forbidden' });
       return;
    }

    if (!issuance.qrToken) {
       res.status(404).json({ error: 'QR Token not found on ticket' });
       return;
    }

    const buffer = await qrcode.toBuffer(issuance.qrToken, { 
      width: 400, 
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
