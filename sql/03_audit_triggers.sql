-- 03_audit_triggers.sql

CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
DECLARE
    v_actor_email TEXT;
    v_actor_role TEXT;
    v_context JSONB;
    v_before JSONB := null;
    v_after JSONB := null;
    v_pk_val TEXT;
BEGIN
    v_actor_email := current_email();
    
    -- Extract role and department from membership
    SELECT jsonb_build_object('role', role, 'department_id', department_id)
    INTO v_context
    FROM department_members 
    WHERE email = v_actor_email;
    
    v_actor_role := v_context->>'role';

    IF (TG_OP = 'DELETE') THEN
        v_before := to_jsonb(OLD);
        v_pk_val := v_before->>'id';
        IF v_pk_val IS NULL THEN v_pk_val := v_before->>'email'; END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_before := to_jsonb(OLD);
        v_after := to_jsonb(NEW);
        v_pk_val := v_after->>'id';
        IF v_pk_val IS NULL THEN v_pk_val := v_after->>'email'; END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        v_after := to_jsonb(NEW);
        v_pk_val := v_after->>'id';
        IF v_pk_val IS NULL THEN v_pk_val := v_after->>'email'; END IF;
    END IF;

    INSERT INTO audit_log (actor_email, actor_role, table_name, action, row_pk, before_json, after_json, context)
    VALUES (v_actor_email, v_actor_role, TG_TABLE_NAME, TG_OP, v_pk_val, v_before, v_after, v_context);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name NOT IN ('audit_log')
    LOOP
        EXECUTE format('CREATE TRIGGER audit_trigger_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION process_audit_log()', t, t);
    END LOOP;
END;
$$;
