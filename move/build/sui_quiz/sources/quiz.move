module sui_quiz::quiz {
    use sui::object::{UID, new};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer; // transfer<T: key>(obj: T, recipient: address)
    use sui::event;    // emit<T>(t: T)

    /// Capacidade administrativa do pacote. Entregue ao publisher no init.
    public struct AdminCap has key { id: UID }

    /// Badge simples para recompensar altas pontuações.
    public struct Badge has key, store {
        id: UID,
        name: vector<u8>,
        score: u8,
        total: u8,
    }

    /// Evento emitido quando um badge é cunhado.
    public struct BadgeMinted has copy, drop {
        recipient: address,
        score: u8,
        total: u8,
    }

    /// Chamado automaticamente na publicação do pacote.
    fun init(ctx: &mut TxContext) {
        let cap = AdminCap { id: new(ctx) };
        transfer::transfer(cap, sender(ctx));
    }

    /// Cunha um badge para `recipient` quando a pontuação é válida.
    /// Requer referência ao `AdminCap` como prova de autoridade.
    entry fun mint_badge(_cap: &AdminCap, recipient: address, score: u8, total: u8, ctx: &mut TxContext) {
        assert!(score <= total, 1);
        let badge = Badge { id: new(ctx), name: b"Sui Savvy", score, total };
        transfer::transfer(badge, recipient);
        event::emit<BadgeMinted>(BadgeMinted { recipient, score, total });
    }
}
