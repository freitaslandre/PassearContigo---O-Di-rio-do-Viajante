const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

exports.notificarNovaReacao = onDocumentCreated(
  'publicacoes/{publicacaoId}/reacoes/{reacaoId}',
  async (event) => {
    const reacao = event.data?.data();
    const { publicacaoId } = event.params;

    if (!reacao || !publicacaoId) {
      return;
    }

    const db = admin.firestore();
    const publicacaoRef = db.collection('publicacoes').doc(publicacaoId);
    const publicacaoSnapshot = await publicacaoRef.get();

    if (!publicacaoSnapshot.exists) {
      logger.info('Publicacao nao encontrada para notificar reacao.', { publicacaoId });
      return;
    }

    const publicacao = publicacaoSnapshot.data();
    const uidDono = publicacao.uidUtilizador;

    if (!uidDono || uidDono === reacao.uidUtilizador) {
      return;
    }

    const tokensSnapshot = await db
      .collection('users')
      .doc(uidDono)
      .collection('fcmTokens')
      .where('ativo', '==', true)
      .get();

    const tokens = tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(Boolean);

    if (tokens.length === 0) {
      logger.info('Utilizador sem tokens FCM ativos.', { uidDono });
      return;
    }

    const autor = reacao.autorNome || 'Alguem';
    const tituloViagem = publicacao.viagemTitulo || 'a sua viagem';
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'Nova reacao',
        body: `${autor} reagiu a ${tituloViagem}.`
      },
      data: {
        tipo: 'nova-reacao',
        publicacaoId,
        viagemId: publicacao.viagemId || '',
        reacaoId: event.params.reacaoId || ''
      }
    });

    const desativacoes = [];

    response.responses.forEach((resultado, index) => {
      if (resultado.success) {
        return;
      }

      const code = resultado.error?.code || '';
      const tokenDoc = tokensSnapshot.docs[index];

      if (
        tokenDoc &&
        (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token'))
      ) {
        desativacoes.push(tokenDoc.ref.update({
          ativo: false,
          erro: code,
          atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
        }));
      }
    });

    await Promise.all(desativacoes);

    logger.info('Notificacao de nova reacao enviada.', {
      publicacaoId,
      enviadas: response.successCount,
      falhadas: response.failureCount
    });
  }
);
